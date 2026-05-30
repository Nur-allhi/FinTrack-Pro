import { supabase } from "../db.js";

export async function getCategories(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("category")
    .eq("user_id", userId)
    .neq("category", "")
    .neq("category", null);
  if (error) throw error;
  return [...new Set((data || []).map((t: any) => t.category).filter(Boolean))].sort();
}

export async function getTransactions(accountId: string, userId: string, limit?: number, offset?: number) {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
  const { data: transactions, error: txError } = await query;
  if (txError) throw txError;
  if (!transactions || transactions.length === 0) return [];

  const linkedIds = transactions
    .filter((tx: any) => tx.linked_transaction_id)
    .map((tx: any) => tx.linked_transaction_id);

  if (linkedIds.length > 0) {
    const { data: linkedTxs, error: linkedError } = await supabase
      .from("transactions")
      .select("id, account_id, accounts(name)")
      .in("id", linkedIds)
      .eq("user_id", userId);

    if (!linkedError && linkedTxs) {
      const linkedMap = new Map(linkedTxs.map((lt: any) => [lt.id, lt.accounts?.[0]?.name]));
      return transactions.map((tx: any) => ({
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
  const { data: result, error } = await supabase.from("transactions").insert([{
    ...data, type: data.type || 'normal', user_id: userId
  }]).select().single();
  if (error) throw error;
  return result;
}

interface SettlementRecord {
  id: number;
  loan_id: number;
  amount: number;
}

function findSettlement(transactionId: number, linkedTransactionId: number | null, accountId: number, amount: number): Promise<SettlementRecord | null> {
  return (async () => {
    let settlement: any = null;

    const { data: byTx } = await supabase
      .from("loan_settlements")
      .select("id, loan_id, amount")
      .eq("transaction_id", transactionId)
      .limit(1);
    settlement = byTx?.[0] ?? null;

    if (!settlement && linkedTransactionId) {
      const { data: byLinked } = await supabase
        .from("loan_settlements")
        .select("id, loan_id, amount")
        .eq("transaction_id", linkedTransactionId)
        .limit(1);
      settlement = byLinked?.[0] ?? null;
    }

    if (!settlement) {
      const { data: loans } = await supabase
        .from("loans")
        .select("id, remaining, status")
        .eq("lender_account_id", accountId)
        .gte("remaining", 0);
      for (const loan of loans ?? []) {
        const { data: matches } = await supabase
          .from("loan_settlements")
          .select("id, amount")
          .eq("loan_id", loan.id)
          .eq("amount", amount)
          .limit(1);
        if (matches?.[0]) {
          settlement = { ...matches[0], loan_id: loan.id };
          break;
        }
      }
    }
    return settlement as SettlementRecord | null;
  })();
}

async function updateSettlementForTransaction(
  transaction: any, userId: string, updates: { amount?: number; date?: string; particulars?: string; category?: string | null; summary?: string | null }
) {
  const amount = updates.amount;
  if (amount === undefined) return;

  let settlement: any = null;

  const { data: byTx } = await supabase
    .from("loan_settlements")
    .select("id, loan_id, amount")
    .eq("transaction_id", transaction.id)
    .limit(1);
  settlement = byTx?.[0] ?? null;

  if (!settlement && transaction.linked_transaction_id) {
    const { data: byLinked } = await supabase
      .from("loan_settlements")
      .select("id, loan_id, amount")
      .eq("transaction_id", transaction.linked_transaction_id)
      .limit(1);
    settlement = byLinked?.[0] ?? null;
  }

  if (settlement) {
    const absAmount = Math.abs(amount);
    const { data: settlements } = await supabase
      .from("loan_settlements")
      .select("amount")
      .eq("loan_id", settlement.loan_id);
    const oldTotalSettled = (settlements ?? []).reduce((sum: number, s: any) => sum + s.amount, 0);
    const newTotalSettled = oldTotalSettled - settlement.amount + absAmount;

    await supabase.from("loan_settlements").update({ amount: absAmount }).eq("id", settlement.id);

    const { data: loan } = await supabase
      .from("loans")
      .select("id, amount, remaining, status")
      .eq("id", settlement.loan_id)
      .single();

    if (loan) {
      const newRemaining = Math.max(0, loan.amount - newTotalSettled);
      const updateData: any = { remaining: newRemaining };
      if (newRemaining <= 0) {
        updateData.status = 'settled';
        updateData.settled_date = new Date().toISOString().split('T')[0];
      } else if (loan.status === 'settled') {
        updateData.status = 'active';
        updateData.settled_date = null;
      }
      await supabase.from("loans").update(updateData).eq("id", loan.id);
    }
  }
}

export async function updateTransaction(userId: string, id: number, updates: {
  date?: string; particulars?: string; category?: string | null; amount?: number; summary?: string | null
}) {
  const { data: transaction, error: fetchError } = await supabase.from("transactions").select("*").eq("id", id).eq("user_id", userId).single();
  if (fetchError) throw fetchError;

  const dbUpdate: any = {};
  if (updates.date !== undefined) dbUpdate.date = updates.date;
  if (updates.particulars !== undefined) dbUpdate.particulars = updates.particulars;
  if (updates.category !== undefined) dbUpdate.category = updates.category;
  if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
  if (updates.summary !== undefined) dbUpdate.summary = updates.summary;

  const { error } = await supabase.from("transactions").update(dbUpdate).eq("id", id).eq("user_id", userId);
  if (error) throw error;

  if (transaction && transaction.linked_transaction_id) {
    const linkedUpdate: any = { ...dbUpdate };
    if (updates.amount !== undefined && (transaction.type === 'transfer' || transaction.type === 'loan_settle')) {
      linkedUpdate.amount = -updates.amount;
    }
    await supabase.from("transactions").update(linkedUpdate).eq("id", transaction.linked_transaction_id).eq("user_id", userId);
  }

  if (transaction && transaction.type === 'loan_settle' && updates.amount !== undefined) {
    await updateSettlementForTransaction(transaction, userId, updates);
  }

  return { success: true };
}

export async function deleteTransaction(userId: string, id: number) {
  const { data: transaction, error: fetchError } = await supabase.from("transactions").select("*").eq("id", id).eq("user_id", userId).single();
  if (fetchError) {
    if ((fetchError as any).code === 'PGRST116') return { success: true };
    throw fetchError;
  }

  if (transaction && transaction.type === 'loan_settle') {
    const settlement = await findSettlement(transaction.id, transaction.linked_transaction_id, transaction.account_id, transaction.amount);
    if (settlement) {
      const { data: loan } = await supabase
        .from("loans")
        .select("id, remaining, status")
        .eq("id", settlement.loan_id)
        .single();
      if (loan) {
        const newRemaining = loan.remaining + settlement.amount;
        const updateData: any = { remaining: newRemaining };
        if (loan.status === 'settled') {
          updateData.status = 'active';
          updateData.settled_date = null;
        }
        await supabase.from("loans").update(updateData).eq("id", loan.id);
        await supabase.from("loan_settlements").delete().eq("id", settlement.id);
      }
    }
  }

  if (transaction && transaction.linked_transaction_id) {
    await supabase.from("transactions").delete().eq("id", transaction.linked_transaction_id).eq("user_id", userId);
  }
  const { error: delError } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  if (delError) throw delError;
  return { success: true };
}

export async function renameCategory(userId: string, oldName: string, newName: string) {
  const { error } = await supabase
    .from("transactions")
    .update({ category: newName })
    .eq("category", oldName)
    .eq("user_id", userId);
  if (error) throw error;
}
