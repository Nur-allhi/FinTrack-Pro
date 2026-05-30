import { supabaseAdmin } from "../db.js";
import { softDeleteOne } from "./queries.js";
import type { Transaction } from "../../shared/types.js";

interface SupabaseTransactionRow {
  id: number; account_id: number; date: string; particulars: string;
  category?: string | null; amount: number; type?: string;
  linked_transaction_id?: number | null; summary?: string | null;
  user_id?: string;
}

interface TransactionWithLinked extends SupabaseTransactionRow {
  linked_account_name?: string;
}

interface LinkedTxRow {
  id: number;
  account_id: number;
  accounts?: { name: string }[] | null;
}

interface SettlementRow {
  id: number; loan_id: number; amount: number;
}

interface LoanRow {
  id: number; remaining: number; status: string;
}

interface SettlementWithLoanId extends SettlementRow {
  loan_id: number;
}

interface CategoryRow {
  category: string | null;
}

function db(): NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

export async function getCategories(userId: string) {
  const { data, error } = await db()
    .from("transactions")
    .select("category")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .neq("category", "")
    .neq("category", null);
  if (error) throw error;
  const cats = (data || []).map((t: CategoryRow) => t.category).filter(Boolean);
  return [...new Set(cats)].sort();
}

export async function getTransactions(accountId: string, userId: string, limit?: number, offset?: number) {
  let query = db()
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
  const { data: transactions, error: txError } = await query;
  if (txError) throw txError;
  if (!transactions || transactions.length === 0) return [];

  const linkedIds = (transactions as SupabaseTransactionRow[])
    .filter((tx) => tx.linked_transaction_id)
    .map((tx) => tx.linked_transaction_id!);

  if (linkedIds.length > 0) {
    const { data: linkedTxs, error: linkedError } = await db()
      .from("transactions")
      .select("id, account_id, accounts(name)")
      .in("id", linkedIds)
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (!linkedError && linkedTxs) {
      const linkedMap = new Map((linkedTxs as LinkedTxRow[]).map((lt) => [lt.id, lt.accounts?.[0]?.name]));
      return (transactions as SupabaseTransactionRow[]).map((tx): TransactionWithLinked => ({
        ...tx,
        linked_account_name: tx.linked_transaction_id ? linkedMap.get(tx.linked_transaction_id) : undefined
      }));
    }
  }
  return transactions;
}

export async function createTransaction(userId: string, data: {
  account_id: number; date: string; particulars: string; category?: string;
  amount: number; type?: string; linked_transaction_id?: number; summary?: string | null
}) {
  const { data: result, error } = await db().from("transactions").insert([{
    ...data, type: data.type || 'normal', user_id: userId
  }]).select().single();
  if (error) throw error;
  return result;
}

function findSettlement(transactionId: number, linkedTransactionId: number | null, accountId: number, amount: number): Promise<SettlementRow | null> {
  return (async () => {
    let settlement: SettlementRow | null = null;

    const { data: byTx } = await db()
      .from("loan_settlements")
      .select("id, loan_id, amount")
      .eq("transaction_id", transactionId)
      .limit(1);
    if (byTx?.[0]) settlement = byTx[0] as SettlementRow;

    if (!settlement && linkedTransactionId) {
      const { data: byLinked } = await db()
        .from("loan_settlements")
        .select("id, loan_id, amount")
        .eq("transaction_id", linkedTransactionId)
        .limit(1);
      if (byLinked?.[0]) settlement = byLinked[0] as SettlementRow;
    }

    if (!settlement) {
      const { data: loans } = await db()
        .from("loans")
        .select("id, remaining, status")
        .eq("lender_account_id", accountId)
        .gte("remaining", 0);
      for (const loan of (loans || []) as LoanRow[]) {
        const { data: matches } = await db()
          .from("loan_settlements")
          .select("id, amount")
          .eq("loan_id", loan.id)
          .eq("amount", amount)
          .limit(1);
        if (matches?.[0]) {
          settlement = { ...matches[0] as SettlementRow, loan_id: loan.id } as SettlementWithLoanId;
          break;
        }
      }
    }
    return settlement as SettlementRow | null;
  })();
}

async function updateSettlementForTransaction(
  transaction: SupabaseTransactionRow, userId: string, updates: { amount?: number; date?: string; particulars?: string; category?: string | null; summary?: string | null }
) {
  const amount = updates.amount;
  if (amount === undefined) return;

  let settlement: SettlementRow | null = null;

  const { data: byTx } = await db()
    .from("loan_settlements")
    .select("id, loan_id, amount")
    .eq("transaction_id", transaction.id)
    .limit(1);
  if (byTx?.[0]) settlement = byTx[0] as SettlementRow;

  if (!settlement && transaction.linked_transaction_id) {
    const { data: byLinked } = await db()
      .from("loan_settlements")
      .select("id, loan_id, amount")
      .eq("transaction_id", transaction.linked_transaction_id)
      .limit(1);
    if (byLinked?.[0]) settlement = byLinked[0] as SettlementRow;
  }

  if (settlement) {
    const absAmount = Math.abs(amount);
    const { data: settlements } = await db()
      .from("loan_settlements")
      .select("amount")
      .eq("loan_id", settlement.loan_id);
    const oldTotalSettled = ((settlements || []) as { amount: number }[]).reduce((sum, s) => sum + s.amount, 0);
    const newTotalSettled = oldTotalSettled - settlement.amount + absAmount;

    await db().from("loan_settlements").update({ amount: absAmount }).eq("id", settlement.id);

    const { data: loan } = await db()
      .from("loans")
      .select("id, amount, remaining, status")
      .eq("id", settlement.loan_id)
      .single();

    if (loan) {
      const newRemaining = Math.max(0, loan.amount - newTotalSettled);
      const updateData: Record<string, string | number | null> = { remaining: newRemaining };
      if (newRemaining <= 0) {
        updateData.status = 'settled';
        updateData.settled_date = new Date().toISOString().split('T')[0];
      } else if (loan.status === 'settled') {
        updateData.status = 'active';
        updateData.settled_date = null;
      }
      await db().from("loans").update(updateData).eq("id", loan.id);
    }
  }
}

export async function updateTransaction(userId: string, id: number, updates: {
  date?: string; particulars?: string; category?: string | null; amount?: number; summary?: string | null
}) {
  const { data: transaction, error: fetchError } = await db().from("transactions").select("*").eq("id", id).eq("user_id", userId).is("deleted_at", null).single();
  if (fetchError) {
    const pgError = fetchError as { code?: string };
    if (pgError.code === 'PGRST116') return { success: true };
    throw fetchError;
  }

  const dbUpdate: Record<string, string | number | null> = {};
  if (updates.date !== undefined) dbUpdate.date = updates.date;
  if (updates.particulars !== undefined) dbUpdate.particulars = updates.particulars;
  if (updates.category !== undefined) dbUpdate.category = updates.category;
  if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
  if (updates.summary !== undefined) dbUpdate.summary = updates.summary;

  const { error } = await db().from("transactions").update(dbUpdate).eq("id", id).eq("user_id", userId);
  if (error) throw error;

  if (transaction && transaction.linked_transaction_id) {
    const linkedUpdate: Record<string, string | number | null> = { ...dbUpdate };
    if (updates.amount !== undefined && (transaction.type === 'transfer' || transaction.type === 'loan_settle')) {
      linkedUpdate.amount = -updates.amount;
    }
    await db().from("transactions").update(linkedUpdate).eq("id", transaction.linked_transaction_id).eq("user_id", userId);
  }

  if (transaction && transaction.type === 'loan_settle' && updates.amount !== undefined) {
    await updateSettlementForTransaction(transaction, userId, updates);
  }

  return { success: true };
}

export async function deleteTransaction(userId: string, id: number) {
  const { data: transaction, error: fetchError } = await db().from("transactions").select("*").eq("id", id).eq("user_id", userId).is("deleted_at", null).single();
  if (fetchError) {
    const pgError = fetchError as { code?: string };
    if (pgError.code === 'PGRST116') return { success: true };
    throw fetchError;
  }

  const now = new Date().toISOString();
  if (transaction && transaction.linked_transaction_id) {
    await db().from("transactions").update({ deleted_at: now }).eq("id", transaction.linked_transaction_id).eq("user_id", userId);
  }
  const { error: delError } = await db().from("transactions").update({ deleted_at: now }).eq("id", id).eq("user_id", userId);
  if (delError) throw delError;
  return { success: true };
}

export async function renameCategory(userId: string, oldName: string, newName: string) {
  const { error } = await db()
    .from("transactions")
    .update({ category: newName })
    .eq("category", oldName)
    .eq("user_id", userId);
  if (error) throw error;
}
