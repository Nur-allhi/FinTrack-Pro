import { supabaseAdmin } from "../db.js";
import type { Loan } from "../../shared/types.js";

interface LoanRow {
  id: number; lender_account_id: number; borrower_account_id?: number | null;
  borrower_name?: string | null; amount: number; date_given: string;
  due_date?: string | null; interest_rate?: number | null;
  particulars?: string; status: string; settled_date?: string | null;
  remaining: number; user_id?: string;
}

interface AccountNameRow {
  id: number; name: string;
}

interface SettleLoanResult {
  success?: boolean;
  notFound?: boolean;
  alreadySettled?: boolean;
  invalidAmount?: boolean;
  remaining?: number;
  settled?: boolean;
  transaction_id?: number;
}

function db(): NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

export async function getLoans(userId: string, limit?: number, offset?: number) {
  let query = db()
    .from("loans")
    .select("*")
    .eq("user_id", userId)
    .order("date_given", { ascending: false });
  if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
  const { data, error } = await query;
  if (error) throw error;

  const rows = data as LoanRow[];
  const accountIds = new Set<number>();
  for (const l of rows) {
    accountIds.add(l.lender_account_id);
    if (l.borrower_account_id) accountIds.add(l.borrower_account_id);
  }
  const { data: accounts } = await db()
    .from("accounts")
    .select("id, name")
    .in("id", [...accountIds]);
  const accountMap = Object.fromEntries(
    ((accounts || []) as AccountNameRow[]).map((a) => [a.id, a.name])
  );

  return rows.map((l) => ({
    ...l,
    lender_name: accountMap[l.lender_account_id] ?? `Account #${l.lender_account_id}`,
    borrower_name: l.borrower_name || (l.borrower_account_id ? accountMap[l.borrower_account_id] : null) || null,
    borrower_account_name: l.borrower_account_id ? (accountMap[l.borrower_account_id] ?? null) : null
  }));
}

export async function createLoan(userId: string, data: {
  lender_account_id: number; borrower_account_id?: number; borrower_name?: string;
  amount: number; date_given: string; due_date?: string | null; interest_rate?: number | null; particulars?: string
}) {
  const isInterAccount = !!data.borrower_account_id;

  const insertData: Record<string, unknown> = {
    lender_account_id: data.lender_account_id, amount: data.amount, date_given: data.date_given,
    due_date: data.due_date || null, interest_rate: data.interest_rate || null,
    particulars: data.particulars || "", status: "active", remaining: data.amount,
    user_id: userId
  };
  if (isInterAccount) {
    insertData.borrower_account_id = data.borrower_account_id!;
  } else {
    insertData.borrower_name = data.borrower_name;
  }

  const { data: loan, error: loanErr } = await db().from("loans").insert([insertData]).select().single();
  if (loanErr) throw loanErr;

  const { data: lenderAcc } = await db()
    .from("accounts")
    .select("name")
    .eq("id", data.lender_account_id)
    .single();
  const lenderName = (lenderAcc as { name: string } | null)?.name ?? `Account #${data.lender_account_id}`;
  let counterpartyName = data.borrower_name;
  if (isInterAccount) {
    const { data: borrowerAcc } = await db()
      .from("accounts")
      .select("name")
      .eq("id", data.borrower_account_id)
      .single();
    counterpartyName = (borrowerAcc as { name: string } | null)?.name ?? `Account #${data.borrower_account_id}`;
  }
  const detail = data.particulars ? ` - ${data.particulars}` : '';

  const { data: debit, error: dErr } = await db().from("transactions").insert([{
    account_id: data.lender_account_id, date: data.date_given,
    particulars: `Loan to: ${counterpartyName}${detail}`,
    category: 'Loan', amount: -data.amount, type: 'loan',
    user_id: userId
  }]).select().single();
  if (dErr) throw dErr;

  if (isInterAccount) {
    const { data: credit, error: cErr } = await db().from("transactions").insert([{
      account_id: data.borrower_account_id, date: data.date_given,
      particulars: `Loan from: ${lenderName}${detail}`,
      category: 'Loan', amount: data.amount, type: 'loan',
      linked_transaction_id: debit.id,
      user_id: userId
    }]).select().single();
    if (cErr) throw cErr;
    await db().from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);
  }
  return loan;
}

export async function updateLoan(userId: string, id: number, updates: {
  amount?: number; due_date?: string | null; interest_rate?: number | null; particulars?: string;
  status?: string; borrower_name?: string | null
}) {
  const dbUpdate: Record<string, string | number | null> = {};
  if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
  if (updates.due_date !== undefined) dbUpdate.due_date = updates.due_date;
  if (updates.interest_rate !== undefined) dbUpdate.interest_rate = updates.interest_rate;
  if (updates.particulars !== undefined) dbUpdate.particulars = updates.particulars;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.borrower_name !== undefined) dbUpdate.borrower_name = updates.borrower_name;
  if (updates.status === 'settled') dbUpdate.settled_date = new Date().toISOString().split('T')[0];

  const { error } = await db().from("loans").update(dbUpdate).eq("id", id).eq("user_id", userId);
  if (error) throw error;
  return { success: true };
}

export async function settleLoan(userId: string, loanId: number, settleAmount?: number): Promise<SettleLoanResult> {
  const { data: loan, error: fetchErr } = await db()
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .eq("user_id", userId)
    .single();
  if (fetchErr) throw fetchErr;
  const loanRow = loan as LoanRow | null;
  if (!loanRow) return { notFound: true };
  if (loanRow.status === 'settled') return { alreadySettled: true };

  const isPersonLoan = !!loanRow.borrower_name;
  const amount = settleAmount ?? loanRow.remaining;
  if (amount <= 0 || amount > loanRow.remaining) {
    return { invalidAmount: true, remaining: loanRow.remaining };
  }

  if (isPersonLoan) {
    return await settlePersonLoan(loanRow, amount, userId);
  }
  return await settleInterAccountLoan(loanRow, amount, userId);
}

async function settlePersonLoan(loan: LoanRow, amount: number, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: lenderAcc } = await db()
    .from("accounts")
    .select("name")
    .eq("id", loan.lender_account_id)
    .single();
  const lenderName = (lenderAcc as { name: string } | null)?.name ?? `Account #${loan.lender_account_id}`;

  const { data: tx, error: txErr } = await db().from("transactions").insert([{
    account_id: loan.lender_account_id, date: today,
    particulars: `Loan settlement from: ${loan.borrower_name}`,
    category: 'Loan Settlement', amount: amount, type: 'loan_settle',
    user_id: userId
  }]).select().single();
  if (txErr) throw txErr;

  await db().from("loan_settlements").insert([{
    loan_id: loan.id, amount, date: today,
    transaction_id: tx.id,
    user_id: userId
  }]);

  const newRemaining = loan.remaining - amount;
  const updateData: Record<string, string | number | null> = { remaining: newRemaining };
  if (newRemaining <= 0) {
    updateData.status = 'settled';
    updateData.settled_date = today;
  }
  await db().from("loans").update(updateData).eq("id", loan.id).eq("user_id", userId);
  return { success: true, remaining: newRemaining, settled: newRemaining <= 0, transaction_id: tx.id };
}

async function settleInterAccountLoan(loan: LoanRow, amount: number, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: accounts } = await db()
    .from("accounts")
    .select("id, name")
    .in("id", [loan.lender_account_id, loan.borrower_account_id!]);
  const accMap = Object.fromEntries(((accounts || []) as AccountNameRow[]).map((a) => [a.id, a.name]));
  const lenderName = accMap[loan.lender_account_id] ?? `Account #${loan.lender_account_id}`;
  const borrowerName = accMap[loan.borrower_account_id!] ?? `Account #${loan.borrower_account_id}`;

  const { data: debit, error: dErr } = await db().from("transactions").insert([{
    account_id: loan.borrower_account_id, date: today,
    particulars: `Loan settlement to: ${lenderName}`,
    category: 'Loan Settlement', amount: -amount, type: 'loan_settle',
    user_id: userId
  }]).select().single();
  if (dErr) throw dErr;

  const { data: credit, error: cErr } = await db().from("transactions").insert([{
    account_id: loan.lender_account_id, date: today,
    particulars: `Loan settlement from: ${borrowerName}`,
    category: 'Loan Settlement', amount: amount, type: 'loan_settle',
    linked_transaction_id: debit.id,
    user_id: userId
  }]).select().single();
  if (cErr) throw cErr;

  await db().from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);

  await db().from("loan_settlements").insert([{
    loan_id: loan.id, amount, date: today,
    transaction_id: credit.id,
    user_id: userId
  }]);

  const newRemaining = loan.remaining - amount;
  const updateData: Record<string, string | number | null> = { remaining: newRemaining };
  if (newRemaining <= 0) {
    updateData.status = 'settled';
    updateData.settled_date = today;
  }
  await db().from("loans").update(updateData).eq("id", loan.id).eq("user_id", userId);
  return { success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 };
}

export async function deleteLoan(userId: string, id: number) {
  const { error } = await db().from("loans").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
