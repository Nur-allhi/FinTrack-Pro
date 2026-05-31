import express from "express";
import { supabaseAdmin } from "../db.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

function db(): NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

interface SearchResult {
  type: 'transaction' | 'account' | 'loan';
  id: number;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  accountId?: number;
}

router.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const userId = req.user!.id;
    const tsQuery = q.split(/\s+/).filter(Boolean).join(' & ');
    const results: SearchResult[] = [];

    const { data: transactions } = await db()
      .from("transactions")
      .select("id, particulars, category, amount, date, account_id, accounts(name)")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or(`fts.teq.${tsQuery},particulars.ilike.%${q}%`)
      .order("date", { ascending: false })
      .limit(20);

    for (const tx of transactions || []) {
      const accountName = Array.isArray(tx.accounts) ? tx.accounts[0]?.name : (tx.accounts as { name?: string })?.name;
      results.push({
        type: 'transaction',
        id: tx.id,
        title: tx.particulars,
        subtitle: `${accountName || 'Account'} · ${tx.category || 'Uncategorized'}`,
        amount: tx.amount,
        date: tx.date,
        accountId: tx.account_id,
      });
    }

    const { data: accounts } = await db()
      .from("accounts")
      .select("id, name, type")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or(`fts.teq.${tsQuery},name.ilike.%${q}%`)
      .limit(10);

    for (const acc of accounts || []) {
      results.push({
        type: 'account',
        id: acc.id,
        title: acc.name,
        subtitle: acc.type.replace('_', ' '),
      });
    }

    const { data: loans } = await db()
      .from("loans")
      .select("id, borrower_name, amount, date_given, particulars, status")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or(`fts.teq.${tsQuery},borrower_name.ilike.%${q}%,particulars.ilike.%${q}%`)
      .order("date_given", { ascending: false })
      .limit(10);

    for (const loan of loans || []) {
      results.push({
        type: 'loan',
        id: loan.id,
        title: loan.borrower_name || 'Loan',
        subtitle: `${loan.status} · ${loan.particulars || ''}`,
        amount: loan.amount,
        date: loan.date_given,
      });
    }

    res.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/search");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
