import express from "express";
import { db, supabase, supabaseAdmin } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("loans")
        .select("*")
        .eq("user_id", req.user!.id)
        .order("date_given", { ascending: false });
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

      const formatted = data.map((l: any) => ({
        ...l,
        lender_name: accountMap[l.lender_account_id] ?? `Account #${l.lender_account_id}`,
        borrower_name: l.borrower_name || (l.borrower_account_id ? accountMap[l.borrower_account_id] : null) || null,
        borrower_account_name: l.borrower_account_id ? (accountMap[l.borrower_account_id] ?? null) : null
      }));
      return res.json(formatted);
    }
    const loans = db.prepare(`
      SELECT l.*, la.name as lender_name,
        COALESCE(l.borrower_name, ba.name) as borrower_name
      FROM loans l
      LEFT JOIN accounts la ON l.lender_account_id = la.id
      LEFT JOIN accounts ba ON l.borrower_account_id = ba.id
      ORDER BY l.date_given DESC
    `).all();
    res.json(loans);
  } catch (err: any) {
    console.error("GET /api/loans error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { lender_account_id, borrower_account_id, borrower_name, amount, date_given, due_date, interest_rate, particulars } = req.body;
    if (!lender_account_id || !amount || !date_given) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isPersonLoan = !!borrower_name;
    const isInterAccount = !!borrower_account_id;

    if (!isPersonLoan && !isInterAccount) {
      return res.status(400).json({ error: "Specify borrower_account_id (inter-account) or borrower_name (person loan)" });
    }
    if (isInterAccount && lender_account_id === borrower_account_id) {
      return res.status(400).json({ error: "Lender and borrower accounts must be different" });
    }

    if (supabaseAdmin) {
      const insertData: any = {
        lender_account_id, amount, date_given,
        due_date: due_date || null, interest_rate: interest_rate || null,
        particulars: particulars || "", status: "active", remaining: amount,
        user_id: req.user!.id
      };
      if (isInterAccount) {
        insertData.borrower_account_id = borrower_account_id;
      } else {
        insertData.borrower_name = borrower_name;
      }

      const { data: loan, error: loanErr } = await supabaseAdmin.from("loans").insert([insertData]).select().single();
      if (loanErr) throw loanErr;

      const { data: lenderAcc } = await supabaseAdmin
        .from("accounts")
        .select("name")
        .eq("id", lender_account_id)
        .single();
      const lenderName = lenderAcc?.name ?? `Account #${lender_account_id}`;
      let counterpartyName = borrower_name;
      if (isInterAccount) {
        const { data: borrowerAcc } = await supabaseAdmin
          .from("accounts")
          .select("name")
          .eq("id", borrower_account_id)
          .single();
        counterpartyName = borrowerAcc?.name ?? `Account #${borrower_account_id}`;
      }
      const detail = particulars ? ` - ${particulars}` : '';

      const { data: debit, error: dErr } = await supabaseAdmin.from("transactions").insert([{
        account_id: lender_account_id, date: date_given,
        particulars: `Loan to: ${counterpartyName}${detail}`,
        category: 'Loan', amount: -amount, type: 'loan',
        user_id: req.user!.id
      }]).select().single();
      if (dErr) throw dErr;

      if (isInterAccount) {
        const { data: credit, error: cErr } = await supabaseAdmin.from("transactions").insert([{
          account_id: borrower_account_id, date: date_given,
          particulars: `Loan from: ${lenderName}${detail}`,
          category: 'Loan', amount: amount, type: 'loan',
          linked_transaction_id: debit.id,
          user_id: req.user!.id
        }]).select().single();
        if (cErr) throw cErr;
        await supabaseAdmin.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", req.user!.id);
      }

      return res.json(loan);
    }

    // SQLite
    let loanId: number;
    if (isInterAccount) {
      loanId = db.prepare(
        "INSERT INTO loans (lender_account_id, borrower_account_id, amount, date_given, due_date, interest_rate, particulars, status, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)"
      ).run(lender_account_id, borrower_account_id, amount, date_given, due_date || null, interest_rate || null, particulars || "", amount).lastInsertRowid;
    } else {
      loanId = db.prepare(
        "INSERT INTO loans (lender_account_id, borrower_name, amount, date_given, due_date, interest_rate, particulars, status, remaining) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)"
      ).run(lender_account_id, borrower_name, amount, date_given, due_date || null, interest_rate || null, particulars || "", amount).lastInsertRowid;
    }

    const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(lender_account_id);
    const lenderName = lenderAcc?.name ?? `Account #${lender_account_id}`;
    const counterpartyName = isPersonLoan ? borrower_name : (db.prepare("SELECT name FROM accounts WHERE id = ?").get(borrower_account_id)?.name ?? `Account #${borrower_account_id}`);
    const detail = particulars ? ` - ${particulars}` : '';

    const debitId = db.prepare(
      "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(lender_account_id, date_given, `Loan to: ${counterpartyName}${detail}`, 'Loan', -amount, 'loan').lastInsertRowid;

    if (isInterAccount) {
      const creditId = db.prepare(
        "INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(borrower_account_id, date_given, `Loan from: ${lenderName}${detail}`, 'Loan', amount, 'loan', debitId).lastInsertRowid;
      db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
    }

    res.json({ id: loanId, lender_account_id, borrower_account_id, borrower_name, amount, remaining: amount, date_given, due_date, interest_rate, particulars, status: "active" });
  } catch (err: any) {
    console.error("POST /api/loans error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { amount, due_date, interest_rate, particulars, status, borrower_name } = req.body;

    if (supabaseAdmin) {
      const update: any = {};
      if (amount !== undefined) update.amount = amount;
      if (due_date !== undefined) update.due_date = due_date;
      if (interest_rate !== undefined) update.interest_rate = interest_rate;
      if (particulars !== undefined) update.particulars = particulars;
      if (status !== undefined) update.status = status;
      if (borrower_name !== undefined) update.borrower_name = borrower_name;
      if (status === 'settled') update.settled_date = new Date().toISOString().split('T')[0];

      const { error } = await supabaseAdmin.from("loans").update(update).eq("id", req.params.id).eq("user_id", req.user!.id);
      if (error) throw error;
      return res.json({ success: true });
    }

    const existing: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Loan not found" });

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
      amount ?? null, due_date ?? null, interest_rate ?? null,
      particulars ?? null, status ?? null,
      status === 'settled' ? 1 : 0,
      borrower_name ?? null,
      req.params.id
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/loans error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/settle", async (req, res) => {
  try {
    const settleAmount = req.body.amount !== undefined ? Number(req.body.amount) : null;

    if (supabaseAdmin) {
      const { data: loan, error: fetchErr } = await supabaseAdmin
        .from("loans")
        .select("*")
        .eq("id", req.params.id)
        .eq("user_id", req.user!.id)
        .single();
      if (fetchErr) throw fetchErr;
      if (!loan) return res.status(404).json({ error: "Loan not found" });
      if (loan.status === 'settled') return res.status(400).json({ error: "Loan already settled" });

      const isPersonLoan = !!loan.borrower_name;

      if (isPersonLoan) {
        const amount = settleAmount ?? loan.remaining;
        if (amount <= 0 || amount > loan.remaining) {
          return res.status(400).json({ error: `Invalid settlement amount. Remaining: ${loan.remaining}` });
        }

        const { data: lenderAcc } = await supabaseAdmin
          .from("accounts")
          .select("name")
          .eq("id", loan.lender_account_id)
          .single();
        const lenderName = lenderAcc?.name ?? `Account #${loan.lender_account_id}`;

        const { data: tx, error: txErr } = await supabaseAdmin.from("transactions").insert([{
          account_id: loan.lender_account_id, date: new Date().toISOString().split('T')[0],
          particulars: `Loan settlement from: ${loan.borrower_name}`,
          category: 'Loan Settlement', amount: amount, type: 'loan_settle',
          user_id: req.user!.id
        }]).select().single();
        if (txErr) throw txErr;

        await supabaseAdmin.from("loan_settlements").insert([{
          loan_id: loan.id, amount, date: new Date().toISOString().split('T')[0],
          transaction_id: tx.id,
          user_id: req.user!.id
        }]);

        const newRemaining = loan.remaining - amount;
        const updateData: any = { remaining: newRemaining };
        if (newRemaining <= 0) {
          updateData.status = 'settled';
          updateData.settled_date = new Date().toISOString().split('T')[0];
        }
        const { error: updErr } = await supabaseAdmin.from("loans").update(updateData).eq("id", loan.id).eq("user_id", req.user!.id);
        if (updErr) throw updErr;

        return res.json({ success: true, remaining: newRemaining, settled: newRemaining <= 0, transaction_id: tx.id });
      }

      // Inter-account: partial or full settle
      const amount = settleAmount ?? loan.remaining;
      if (amount <= 0 || amount > loan.remaining) {
        return res.status(400).json({ error: `Invalid settlement amount. Remaining: ${loan.remaining}` });
      }

      const { data: accounts } = await supabaseAdmin
        .from("accounts")
        .select("id, name")
        .in("id", [loan.lender_account_id, loan.borrower_account_id]);
      const accMap = Object.fromEntries((accounts ?? []).map((a: any) => [a.id, a.name]));
      const lenderName = accMap[loan.lender_account_id] ?? `Account #${loan.lender_account_id}`;
      const borrowerName = accMap[loan.borrower_account_id] ?? `Account #${loan.borrower_account_id}`;

      const { data: debit, error: dErr } = await supabaseAdmin.from("transactions").insert([{
        account_id: loan.borrower_account_id, date: new Date().toISOString().split('T')[0],
        particulars: `Loan settlement to: ${lenderName}`,
        category: 'Loan Settlement', amount: -amount, type: 'loan_settle',
        user_id: req.user!.id
      }]).select().single();
      if (dErr) throw dErr;

      const { data: credit, error: cErr } = await supabaseAdmin.from("transactions").insert([{
        account_id: loan.lender_account_id, date: new Date().toISOString().split('T')[0],
        particulars: `Loan settlement from: ${borrowerName}`,
        category: 'Loan Settlement', amount: amount, type: 'loan_settle',
        linked_transaction_id: debit.id,
        user_id: req.user!.id
      }]).select().single();
      if (cErr) throw cErr;

      await supabaseAdmin.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", req.user!.id);

      await supabaseAdmin.from("loan_settlements").insert([{
        loan_id: loan.id, amount, date: new Date().toISOString().split('T')[0],
        transaction_id: credit.id,
        user_id: req.user!.id
      }]);

      const newRemaining = loan.remaining - amount;
      const updateData: any = { remaining: newRemaining };
      if (newRemaining <= 0) {
        updateData.status = 'settled';
        updateData.settled_date = new Date().toISOString().split('T')[0];
      }
      const { error: updErr } = await supabaseAdmin.from("loans").update(updateData).eq("id", req.params.id).eq("user_id", req.user!.id);
      if (updErr) throw updErr;

      return res.json({ success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 });
    }

    // SQLite
    const existing: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Loan not found" });
    if (existing.status === 'settled') return res.status(400).json({ error: "Loan already settled" });

    const isPersonLoan = !!existing.borrower_name;
    const today = new Date().toISOString().split('T')[0];

    if (isPersonLoan) {
      const amount = settleAmount ?? existing.remaining;
      if (amount <= 0 || amount > existing.remaining) {
        return res.status(400).json({ error: `Invalid settlement amount. Remaining: ${existing.remaining}` });
      }

      const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(existing.lender_account_id);
      const lenderName = lenderAcc?.name ?? `Account #${existing.lender_account_id}`;

      const txId = db.prepare(
        "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(existing.lender_account_id, today, `Loan settlement from: ${existing.borrower_name}`, 'Loan Settlement', amount, 'loan_settle').lastInsertRowid;

      db.prepare(
        "INSERT INTO loan_settlements (loan_id, amount, date, user_id, transaction_id) VALUES (?, ?, ?, ?, ?)"
      ).run(existing.id, amount, today, null, txId);

      const newRemaining = existing.remaining - amount;
      if (newRemaining <= 0) {
        db.prepare("UPDATE loans SET remaining = 0, status = 'settled', settled_date = date('now') WHERE id = ?").run(existing.id);
      } else {
        db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, existing.id);
      }

      return res.json({ success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 });
    }

    // Inter-account: partial or full settle
    const amount = settleAmount ?? existing.remaining;
    if (amount <= 0 || amount > existing.remaining) {
      return res.status(400).json({ error: `Invalid settlement amount. Remaining: ${existing.remaining}` });
    }

    const lenderAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(existing.lender_account_id);
    const borrowerAcc: any = db.prepare("SELECT name FROM accounts WHERE id = ?").get(existing.borrower_account_id);
    const lenderName = lenderAcc?.name ?? `Account #${existing.lender_account_id}`;
    const borrowerName = borrowerAcc?.name ?? `Account #${existing.borrower_account_id}`;

    const debitId = db.prepare(
      "INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(existing.borrower_account_id, today, `Loan settlement to: ${lenderName}`, 'Loan Settlement', -amount, 'loan_settle').lastInsertRowid;

    const creditId = db.prepare(
      "INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(existing.lender_account_id, today, `Loan settlement from: ${borrowerName}`, 'Loan Settlement', amount, 'loan_settle', debitId).lastInsertRowid;

    db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
    db.prepare(
      "INSERT INTO loan_settlements (loan_id, amount, date, user_id, transaction_id) VALUES (?, ?, ?, ?, ?)"
    ).run(existing.id, amount, today, null, creditId);

    const newRemaining = existing.remaining - amount;
    if (newRemaining <= 0) {
      db.prepare("UPDATE loans SET remaining = 0, status = 'settled', settled_date = date('now') WHERE id = ?").run(req.params.id);
    } else {
      db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, existing.id);
    }
    res.json({ success: true, remaining: Math.max(0, newRemaining), settled: newRemaining <= 0 });
  } catch (err: any) {
    console.error("POST /api/loans/:id/settle error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("loans").delete().eq("id", req.params.id).eq("user_id", req.user!.id);
      if (error) throw error;
      return res.json({ success: true });
    }
    db.prepare("DELETE FROM loans WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/loans error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
