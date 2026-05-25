import { db, supabase, supabaseAdmin } from "../db.js";

interface SettleLoanResult {
  success?: boolean;
  notFound?: boolean;
  alreadySettled?: boolean;
  invalidAmount?: boolean;
  remaining?: number;
  settled?: boolean;
  transaction_id?: number;
}

export async function getLoans(userId: string, limit?: number, offset?: number) {
  if (supabaseAdmin) {
    let query = supabaseAdmin
      .from("loans")
      .select("*")
      .eq("user_id", userId)
      .order("date_given", { ascending: false });
    if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
    const { data, error } = await query;
    if (error) throw error;

    const accountIds = new Set<number>();
    for (const l of data) {
      accountIds.add(l.lender_account_id);
      if (l.borrower_account_id) accountIds.add(l.borrower_account_id);
    }
    const { data: accounts } = await supabaseAdmin
      .from("accounts")
      .select("id, name")
      .in("id", [...accountIds]);
    const accountMap = Object.fromEntries(
      (accounts ?? []).map((a: any) => [a.id, a.name])
    );

    return data.map((l: any) => ({
      ...l,
      lender_name: accountMap[l.lender_account_id] ?? `Account #${l.lender_account_id}`,
      borrower_name: l.borrower_name || (l.borrower_account_id ? accountMap[l.borrower_account_id] : null) || null,
      borrower_account_name: l.borrower_account_id ? (accountMap[l.borrower_account_id] ?? null) : null
    }));
  }

  return db.prepare(`
    SELECT l.*, la.name as lender_name,
      COALESCE(l.borrower_name, ba.name) as borrower_name
    FROM loans l
    LEFT JOIN accounts la ON l.lender_account_id = la.id
    LEFT JOIN accounts ba ON l.borrower_account_id = ba.id
    ORDER BY l.date_given DESC
  `).all();
}

export async function createLoan(userId: string, data: {
  lender_account_id: number; borrower_account_id?: number; borrower_name?: string;
  amount: number; date_given: string; due_date?: string | null; interest_rate?: number | null; particulars?: string
}) {
  const isPersonLoan = !!data.borrower_name;
  const isInterAccount = !!data.borrower_account_id;

  if (supabaseAdmin) {
    const insertData: any = {
      lender_account_id: data.lender_account_id, amount: data.amount, date_given: data.date_given,
      due_date: data.due_date || null, interest_rate: data.interest_rate || null,
      particulars: data.particulars || "", status: "active", remaining: data.amount,
      user_id: userId
    };
    if (isInterAccount) {
      insertData.borrower_account_id = data.borrower_account_id;
    } else {
      insertData.borrower_name = data.borrower_name;
    }

    const { data: loan, error: loanErr } = await supabaseAdmin.from("loans").insert([insertData]).select().single();
    if (loanErr) throw loanErr;

    const { data: lenderAcc } = await supabaseAdmin
      .from("accounts")
      .select("name")
      .eq("id", data.lender_account_id)
      .single();
    const lenderName = lenderAcc?.name ?? `Account #${data.lender_account_id}`;
    let counterpartyName = data.borrower_name;
    if (isInterAccount) {
      const { data: borrowerAcc } = await supabaseAdmin
        .from("accounts")
        .select("name")
        .eq("id", data.borrower_account_id)
        .single();
      counterpartyName = borrowerAcc?.name ?? `Account #${data.borrower_account_id}`;
    }
    const detail = data.particulars ? ` - ${data.particulars}` : '';

    const { data: debit, error: dErr } = await supabaseAdmin.from("transactions").insert([{
      account_id: data.lender_account_id, date: data.date_given,
      particulars: `Loan to: ${counterpartyName}${detail}`,
      category: 'Loan', amount: -data.amount, type: 'loan',
      user_id: userId
    }]).select().single();
    if (dErr) throw dErr;

    if (isInterAccount) {
      const { data: credit, error: cErr } = await supabaseAdmin.from("transactions").insert([{
        account_id: data.borrower_account_id, date: data.date_given,
        particulars: `Loan from: ${lenderName}${detail}`,
        category: 'Loan', amount: data.amount, type: 'loan',
        linked_transaction_id: debit.id,
        user_id: userId
      }]).select().single();
      if (cErr) throw cErr;
      await supabaseAdmin.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);
    }
    return loan;
  }

  let loanId: number;
  if (isInterAccount) {
    loanId = db.prepare(
      "INSERT INTO loans (lender_account_id, borrower_account_id, amount, date_given, due_date, interest_rate, particulars, status, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)"
    ).run(data.lender_account_id, data.borrower_account_id, data.amount, data.date_given, data.due_date || null, data.interest_rate || null, data.particulars || "", data.amount).lastInsertRowid;
  } else {
    loanId = db.prepare(
      "INSERT INTO loans (lender_account_id, borrower_name, amount, date_given, due_date, interest_rate, particulars, status, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)"
    ).run(data.lender_account_id, data.borrower_name, data.amount, data.date_given, data.due_date || null, data.interest_rate || null, data.particulars || "", data.amount).lastInsertRowid;
  }

  const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(data.lender_account_id);
  const lenderName = lenderAcc?.name ?? `Account #${data.lender_account_id}`;
  const counterpartyName = isPersonLoan ? data.borrower_name : (db.prepare("SELECT name FROM accounts WHERE id = ?").get(data.borrower_account_id)?.name ?? `Account #${data.borrower_account_id}`);
  const detail = data.particulars ? ` - ${data.particulars}` : '';

  const debitId = db.prepare(
    "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(data.lender_account_id, data.date_given, `Loan to: ${counterpartyName}${detail}`, 'Loan', -data.amount, 'loan').lastInsertRowid;

  if (isInterAccount) {
    const creditId = db.prepare(
      "INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(data.borrower_account_id, data.date_given, `Loan from: ${lenderName}${detail}`, 'Loan', data.amount, 'loan', debitId).lastInsertRowid;
    db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
  }

  return { id: loanId, lender_account_id: data.lender_account_id, borrower_account_id: data.borrower_account_id, borrower_name: data.borrower_name, amount: data.amount, remaining: data.amount, date_given: data.date_given, due_date: data.due_date, interest_rate: data.interest_rate, particulars: data.particulars, status: "active" };
}

export async function updateLoan(userId: string, id: number, updates: {
  amount?: number; due_date?: string | null; interest_rate?: number | null; particulars?: string;
  status?: string; borrower_name?: string | null
}) {
  if (supabaseAdmin) {
    const dbUpdate: any = {};
    if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
    if (updates.due_date !== undefined) dbUpdate.due_date = updates.due_date;
    if (updates.interest_rate !== undefined) dbUpdate.interest_rate = updates.interest_rate;
    if (updates.particulars !== undefined) dbUpdate.particulars = updates.particulars;
    if (updates.status !== undefined) dbUpdate.status = updates.status;
    if (updates.borrower_name !== undefined) dbUpdate.borrower_name = updates.borrower_name;
    if (updates.status === 'settled') dbUpdate.settled_date = new Date().toISOString().split('T')[0];

    const { error } = await supabaseAdmin.from("loans").update(dbUpdate).eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  }

  const existing: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(id);
  if (!existing) return { success: false, notFound: true };

  db.prepare(`
    UPDATE loans SET
      amount = COALESCE(?, amount),
      due_date = COALESCE(?, due_date),
      interest_rate = COALESCE(?, interest_rate),
      particulars = COALESCE(?, particulars),
      status = COALESCE(?, status),
      settled_date = CASE WHEN ? = 1 THEN date('now') ELSE settled_date END,
      borrower_name = COALESCE(?, borrower_name)
    WHERE id = ?
  `).run(
    updates.amount ?? null, updates.due_date ?? null, updates.interest_rate ?? null,
    updates.particulars ?? null, updates.status ?? null,
    updates.status === 'settled' ? 1 : 0,
    updates.borrower_name ?? null,
    id
  );
  return { success: true };
}

export async function settleLoan(userId: string, loanId: number, settleAmount?: number): Promise<SettleLoanResult> {
  if (supabaseAdmin) {
    const { data: loan, error: fetchErr } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .eq("user_id", userId)
      .single();
    if (fetchErr) throw fetchErr;
    if (!loan) return { notFound: true };
    if (loan.status === 'settled') return { alreadySettled: true };

    const isPersonLoan = !!loan.borrower_name;
    const amount = settleAmount ?? loan.remaining;
    if (amount <= 0 || amount > loan.remaining) {
      return { invalidAmount: true, remaining: loan.remaining };
    }

    if (isPersonLoan) {
      return await settlePersonLoanSupabase(loan, amount, userId);
    }
    return await settleInterAccountLoanSupabase(loan, amount, userId);
  }

  const existing: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId);
  if (!existing) return { notFound: true };
  if (existing.status === 'settled') return { alreadySettled: true };

  const amount = settleAmount ?? existing.remaining;
  if (amount <= 0 || amount > existing.remaining) {
    return { invalidAmount: true, remaining: existing.remaining };
  }

  const isPersonLoan = !!existing.borrower_name;
  if (isPersonLoan) {
    return settlePersonLoanSqlite(existing, amount);
  }
  return settleInterAccountLoanSqlite(existing, amount);
}

async function settlePersonLoanSupabase(loan: any, amount: number, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: lenderAcc } = await supabaseAdmin!
    .from("accounts")
    .select("name")
    .eq("id", loan.lender_account_id)
    .single();
  const lenderName = lenderAcc?.name ?? `Account #${loan.lender_account_id}`;

  const { data: tx, error: txErr } = await supabaseAdmin!.from("transactions").insert([{
    account_id: loan.lender_account_id, date: today,
    particulars: `Loan settlement from: ${loan.borrower_name}`,
    category: 'Loan Settlement', amount: amount, type: 'loan_settle',
    user_id: userId
  }]).select().single();
  if (txErr) throw txErr;

  await supabaseAdmin!.from("loan_settlements").insert([{
    loan_id: loan.id, amount, date: today,
    transaction_id: tx.id,
    user_id: userId
  }]);

  const newRemaining = loan.remaining - amount;
  const updateData: any = { remaining: newRemaining };
  if (newRemaining <= 0) {
    updateData.status = 'settled';
    updateData.settled_date = today;
  }
  await supabaseAdmin!.from("loans").update(updateData).eq("id", loan.id).eq("user_id", userId);
  return { success: true, remaining: newRemaining, settled: newRemaining <= 0, transaction_id: tx.id };
}

async function settleInterAccountLoanSupabase(loan: any, amount: number, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: accounts } = await supabaseAdmin!
    .from("accounts")
    .select("id, name")
    .in("id", [loan.lender_account_id, loan.borrower_account_id]);
  const accMap = Object.fromEntries((accounts ?? []).map((a: any) => [a.id, a.name]));
  const lenderName = accMap[loan.lender_account_id] ?? `Account #${loan.lender_account_id}`;
  const borrowerName = accMap[loan.borrower_account_id] ?? `Account #${loan.borrower_account_id}`;

  const { data: debit, error: dErr } = await supabaseAdmin!.from("transactions").insert([{
    account_id: loan.borrower_account_id, date: today,
    particulars: `Loan settlement to: ${lenderName}`,
    category: 'Loan Settlement', amount: -amount, type: 'loan_settle',
    user_id: userId
  }]).select().single();
  if (dErr) throw dErr;

  const { data: credit, error: cErr } = await supabaseAdmin!.from("transactions").insert([{
    account_id: loan.lender_account_id, date: today,
    particulars: `Loan settlement from: ${borrowerName}`,
    category: 'Loan Settlement', amount: amount, type: 'loan_settle',
    linked_transaction_id: debit.id,
    user_id: userId
  }]).select().single();
  if (cErr) throw cErr;

  await supabaseAdmin!.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);

  await supabaseAdmin!.from("loan_settlements").insert([{
    loan_id: loan.id, amount, date: today,
    transaction_id: credit.id,
    user_id: userId
  }]);

  const newRemaining = loan.remaining - amount;
  const updateData: any = { remaining: newRemaining };
  if (newRemaining <= 0) {
    updateData.status = 'settled';
    updateData.settled_date = today;
  }
  await supabaseAdmin!.from("loans").update(updateData).eq("id", loan.id).eq("user_id", userId);
  return { success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 };
}

function settlePersonLoanSqlite(loan: any, amount: number) {
  const today = new Date().toISOString().split('T')[0];
  const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(loan.lender_account_id);
  const lenderName = lenderAcc?.name ?? `Account #${loan.lender_account_id}`;

  const txId = db.prepare(
    "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(loan.lender_account_id, today, `Loan settlement from: ${loan.borrower_name}`, 'Loan Settlement', amount, 'loan_settle').lastInsertRowid;

  db.prepare(
    "INSERT INTO loan_settlements (loan_id, amount, date, user_id, transaction_id) VALUES (?, ?, ?, ?, ?)"
  ).run(loan.id, amount, today, null, txId);

  const newRemaining = loan.remaining - amount;
  if (newRemaining <= 0) {
    db.prepare("UPDATE loans SET remaining = 0, status = 'settled', settled_date = date('now') WHERE id = ?").run(loan.id);
  } else {
    db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, loan.id);
  }
  return { success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 };
}

function settleInterAccountLoanSqlite(loan: any, amount: number) {
  const today = new Date().toISOString().split('T')[0];
  const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(loan.lender_account_id);
  const borrowerAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(loan.borrower_account_id);
  const lenderName = lenderAcc?.name ?? `Account #${loan.lender_account_id}`;
  const borrowerName = borrowerAcc?.name ?? `Account #${loan.borrower_account_id}`;

  const debitId = db.prepare(
    "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(loan.borrower_account_id, today, `Loan settlement to: ${lenderName}`, 'Loan Settlement', -amount, 'loan_settle').lastInsertRowid;

  const creditId = db.prepare(
    "INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(loan.lender_account_id, today, `Loan settlement from: ${borrowerName}`, 'Loan Settlement', amount, 'loan_settle', debitId).lastInsertRowid;

  db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
  db.prepare(
    "INSERT INTO loan_settlements (loan_id, amount, date, user_id, transaction_id) VALUES (?, ?, ?, ?, ?)"
  ).run(loan.id, amount, today, null, creditId);

  const newRemaining = loan.remaining - amount;
  if (newRemaining <= 0) {
    db.prepare("UPDATE loans SET remaining = 0, status = 'settled', settled_date = date('now') WHERE id = ?").run(loan.id);
  } else {
    db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, loan.id);
  }
  return { success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 };
}

export async function deleteLoan(userId: string, id: number) {
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from("loans").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  db.prepare("DELETE FROM loans WHERE id = ?").run(id);
}
