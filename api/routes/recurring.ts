import express from "express";
import { db } from "../db.js";
import { recurringSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await db()
      .from("recurring_transactions")
      .select("*, accounts(name)")
      .eq("user_id", req.user!.id)
      .order("next_date");
    if (error) throw error;
    const results = (data || []).map((r: Record<string, unknown>) => ({
      ...r,
      account_name: Array.isArray(r.accounts) ? (r.accounts as { name: string }[])[0]?.name : (r.accounts as { name?: string })?.name,
    }));
    res.json(results);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "GET /api/recurring");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(recurringSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const { account_id, particulars, category, amount, frequency, next_date } = parsed.data;
    const { data, error } = await db()
      .from("recurring_transactions")
      .insert({ user_id: req.user!.id, account_id, particulars, category, amount, frequency, next_date })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "POST /api/recurring");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { active } = req.body;
    const { data, error } = await db()
      .from("recurring_transactions")
      .update({ active })
      .eq("id", Number(req.params.id))
      .eq("user_id", req.user!.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "PATCH /api/recurring/:id");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await db()
      .from("recurring_transactions")
      .delete()
      .eq("id", Number(req.params.id))
      .eq("user_id", req.user!.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "DELETE /api/recurring/:id");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.post("/process", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data: due, error: fetchErr } = await db()
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", req.user!.id)
      .eq("active", true)
      .lte("next_date", today);
    if (fetchErr) throw fetchErr;

    let processed = 0;
    for (const rec of due || []) {
      const { error: txErr } = await db().from("transactions").insert({
        user_id: req.user!.id,
        account_id: rec.account_id,
        date: rec.next_date,
        particulars: rec.particulars,
        category: rec.category,
        amount: rec.amount,
        type: "normal",
      });
      if (txErr) continue;

      const next = computeNextDate(rec.next_date, rec.frequency);
      await db()
        .from("recurring_transactions")
        .update({ next_date: next })
        .eq("id", rec.id);
      processed++;
    }
    res.json({ processed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "POST /api/recurring/process");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

function computeNextDate(currentDate: string, frequency: string): string {
  const d = new Date(currentDate);
  switch (frequency) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

export default router;
