import express from "express";
import { db } from "../db.js";
import { budgetSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const { data, error } = await db()
      .from("budgets")
      .select("*")
      .eq("user_id", req.user!.id)
      .eq("month", month)
      .order("category");
    if (error) throw error;
    res.json(data || []);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "GET /api/budgets");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(budgetSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const { category, amount, month } = parsed.data;
    const { data, error } = await db()
      .from("budgets")
      .upsert({ user_id: req.user!.id, category, amount, month }, { onConflict: "user_id,category,month" })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "POST /api/budgets");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await db()
      .from("budgets")
      .delete()
      .eq("id", Number(req.params.id))
      .eq("user_id", req.user!.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ requestId: req.requestId, error: msg }, "DELETE /api/budgets/:id");
    sendError(res, 500, msg, "INTERNAL_ERROR");
  }
});

export default router;
