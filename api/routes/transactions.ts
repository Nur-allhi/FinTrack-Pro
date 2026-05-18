import express from "express";
import { db, supabase, supabaseAdmin } from "../db.js";
import { requireQuota } from "../middleware/quota.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("transactions")
        .select("category")
        .eq("user_id", req.user!.id)
        .neq("category", "")
        .neq("category", null);
      if (error) throw error;
      const categories = [...new Set((data || []).map((t: any) => t.category).filter(Boolean))].sort();
      return res.json(categories);
    }
    const rows = db.prepare("SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != '' ORDER BY category").all();
    const categories = rows.map((r: any) => r.category);
    res.json(categories);
  } catch (err: any) {
    console.error("GET /api/transactions/categories error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:accountId", async (req, res) => {
  try {
    if (supabase) {
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", req.params.accountId)
        .eq("user_id", req.user!.id)
        .order("date", { ascending: false })
        .order("id", { ascending: false });
        
      if (txError) throw txError;
      if (!transactions || transactions.length === 0) return res.json([]);

      const linkedIds = transactions
        .filter(tx => tx.linked_transaction_id)
        .map(tx => tx.linked_transaction_id);

      if (linkedIds.length > 0) {
        const { data: linkedTxs, error: linkedError } = await supabase
          .from("transactions")
          .select("id, account_id, accounts(name)")
          .in("id", linkedIds)
          .eq("user_id", req.user!.id);

        if (!linkedError && linkedTxs) {
          const linkedMap = new Map(linkedTxs.map((lt: any) => [lt.id, lt.accounts?.[0]?.name]));
          const formatted = transactions.map(tx => ({
            ...tx,
            linked_account_name: tx.linked_transaction_id ? linkedMap.get(tx.linked_transaction_id) : undefined
          }));
          return res.json(formatted);
        }
      }
      
      return res.json(transactions);
    }
    
    const transactions = db.prepare(`
      SELECT t.*, la.name as linked_account_name
      FROM transactions t
      LEFT JOIN transactions lt ON t.linked_transaction_id = lt.id
      LEFT JOIN accounts la ON lt.account_id = la.id
      WHERE t.account_id = ?
      ORDER BY t.date DESC, t.id DESC
    `).all(req.params.accountId);
    
    res.json(transactions || []);
  } catch (err: any) {
    console.error("GET /api/transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireQuota, async (req, res) => {
  try {
    const { account_id, date, particulars, category, amount, type, linked_transaction_id, summary } = req.body;
    if (!account_id || !date || !particulars || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (supabase) {
      const { data, error } = await supabase.from("transactions").insert([{
        account_id, date, particulars, category, amount, type: type || 'normal', linked_transaction_id, summary,
        user_id: req.user!.id
      }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(account_id, date, particulars, category, amount, type || 'normal', linked_transaction_id, summary);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    console.error("POST /api/transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { date, particulars, category, amount, summary } = req.body;
    
    if (supabase) {
      const { data: transaction, error: fetchError } = await supabase.from("transactions").select("*").eq("id", req.params.id).eq("user_id", req.user!.id).single();
      if (fetchError) throw fetchError;

      const update: any = {};
      if (date !== undefined) update.date = date;
      if (particulars !== undefined) update.particulars = particulars;
      if (category !== undefined) update.category = category;
      if (amount !== undefined) update.amount = amount;
      if (summary !== undefined) update.summary = summary;
      
      const { error } = await supabase.from("transactions").update(update).eq("id", req.params.id).eq("user_id", req.user!.id);
      if (error) throw error;

      if (transaction && transaction.linked_transaction_id) {
        const linkedUpdate: any = { ...update };
        if (amount !== undefined && (transaction.type === 'transfer' || transaction.type === 'loan_settle')) {
          linkedUpdate.amount = -amount;
        }
        await supabase.from("transactions").update(linkedUpdate).eq("id", transaction.linked_transaction_id).eq("user_id", req.user!.id);
      }

      if (transaction && transaction.type === 'loan_settle' && amount !== undefined && supabaseAdmin) {
        let settlement: any = null;

        const { data: settlementsByTx } = await supabaseAdmin
          .from("loan_settlements")
          .select("id, loan_id, amount")
          .eq("transaction_id", transaction.id)
          .limit(1);
        settlement = settlementsByTx?.[0] ?? null;

        if (!settlement && transaction.linked_transaction_id) {
          const { data: settlementsByLinked } = await supabaseAdmin
            .from("loan_settlements")
            .select("id, loan_id, amount")
            .eq("transaction_id", transaction.linked_transaction_id)
            .limit(1);
          settlement = settlementsByLinked?.[0] ?? null;
        }

        if (settlement) {
          const absAmount = Math.abs(amount);
          const { data: settlements } = await supabaseAdmin
            .from("loan_settlements")
            .select("amount")
            .eq("loan_id", settlement.loan_id);
          const oldTotalSettled = (settlements ?? []).reduce((sum: number, s: any) => sum + s.amount, 0);
          const newTotalSettled = oldTotalSettled - settlement.amount + absAmount;

          await supabaseAdmin.from("loan_settlements").update({ amount: absAmount }).eq("id", settlement.id);

          const { data: loan } = await supabaseAdmin
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
            await supabaseAdmin.from("loans").update(updateData).eq("id", loan.id);
          }
        }
      }

      return res.json({ success: true });
    }

    const transaction: any = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE transactions SET 
          date = COALESCE(?, date), 
          particulars = COALESCE(?, particulars), 
          category = COALESCE(?, category),
          amount = COALESCE(?, amount),
          summary = COALESCE(?, summary)
        WHERE id = ?
      `).run(date, particulars, category, amount, summary, req.params.id);

      if (transaction.linked_transaction_id) {
        let linkedAmount = undefined;
        if (amount !== undefined && (transaction.type === 'transfer' || transaction.type === 'loan_settle')) {
          linkedAmount = -amount;
        }
        db.prepare(`
          UPDATE transactions SET 
            date = COALESCE(?, date), 
            particulars = COALESCE(?, particulars), 
            category = COALESCE(?, category),
            amount = COALESCE(?, amount),
            summary = COALESCE(?, summary)
          WHERE id = ?
        `).run(date, particulars, category, linkedAmount, summary, transaction.linked_transaction_id);
      }
    });

    updateTx();

    if (transaction.type === 'loan_settle' && amount !== undefined) {
      let settlement: any = db.prepare("SELECT * FROM loan_settlements WHERE transaction_id = ?").get(transaction.id);

      if (!settlement && transaction.linked_transaction_id) {
        settlement = db.prepare("SELECT * FROM loan_settlements WHERE transaction_id = ?").get(transaction.linked_transaction_id);
      }

      if (settlement) {
        const absAmount = Math.abs(amount);
        const oldTotalSettled = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM loan_settlements WHERE loan_id = ?").get(settlement.loan_id).total;
        const newTotalSettled = oldTotalSettled - settlement.amount + absAmount;

        db.prepare("UPDATE loan_settlements SET amount = ? WHERE id = ?").run(absAmount, settlement.id);

        const loan: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(settlement.loan_id);
        if (loan) {
          const newRemaining = Math.max(0, loan.amount - newTotalSettled);
          if (newRemaining <= 0) {
            db.prepare("UPDATE loans SET remaining = 0, status = 'settled', settled_date = date('now') WHERE id = ?").run(loan.id);
          } else if (loan.status === 'settled') {
            db.prepare("UPDATE loans SET remaining = ?, status = 'active', settled_date = NULL WHERE id = ?").run(newRemaining, loan.id);
          } else {
            db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, loan.id);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { data: transaction, error: fetchError } = await supabase.from("transactions").select("*").eq("id", req.params.id).eq("user_id", req.user!.id).single();
      if (fetchError) {
        if (fetchError.code === 'PGRST116') return res.json({ success: true });
        throw fetchError;
      }

      if (transaction && transaction.type === 'loan_settle' && supabaseAdmin) {
        let settlement: any = null;

        const { data: settlementsByTx } = await supabaseAdmin
          .from("loan_settlements")
          .select("id, loan_id, amount")
          .eq("transaction_id", transaction.id)
          .limit(1);
        settlement = settlementsByTx?.[0] ?? null;

        if (!settlement && transaction.linked_transaction_id) {
          const { data: settlementsByLinked } = await supabaseAdmin
            .from("loan_settlements")
            .select("id, loan_id, amount")
            .eq("transaction_id", transaction.linked_transaction_id)
            .limit(1);
          settlement = settlementsByLinked?.[0] ?? null;
        }

        if (!settlement) {
          const { data: loans } = await supabaseAdmin
            .from("loans")
            .select("id, remaining, status")
            .eq("lender_account_id", transaction.account_id)
            .gte("remaining", 0);
          for (const loan of loans ?? []) {
            const { data: matches } = await supabaseAdmin
              .from("loan_settlements")
              .select("id, amount")
              .eq("loan_id", loan.id)
              .eq("amount", transaction.amount)
              .limit(1);
            if (matches?.[0]) {
              settlement = { ...matches[0], loan_id: loan.id };
              break;
            }
          }
        }

        if (settlement) {
          const { data: loan } = await supabaseAdmin
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
            await supabaseAdmin.from("loans").update(updateData).eq("id", loan.id);
            await supabaseAdmin.from("loan_settlements").delete().eq("id", settlement.id);
          }
        }
      }

      if (transaction && transaction.linked_transaction_id) {
        await supabase.from("transactions").delete().eq("id", transaction.linked_transaction_id).eq("user_id", req.user!.id);
      }
      const { error: delError } = await supabase.from("transactions").delete().eq("id", req.params.id).eq("user_id", req.user!.id);
      if (delError) throw delError;
      return res.json({ success: true });
    }

    const transaction: any = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!transaction) return res.json({ success: true });

    if (transaction.type === 'loan_settle') {
      let settlement: any = db.prepare("SELECT * FROM loan_settlements WHERE transaction_id = ?").get(transaction.id);

      if (!settlement && transaction.linked_transaction_id) {
        settlement = db.prepare("SELECT * FROM loan_settlements WHERE transaction_id = ?").get(transaction.linked_transaction_id);
      }

      if (!settlement) {
        settlement = db.prepare(`
          SELECT ls.* FROM loan_settlements ls
          JOIN loans l ON ls.loan_id = l.id
          WHERE l.lender_account_id = ? AND ls.amount = ?
          LIMIT 1
        `).get(transaction.account_id, transaction.amount);
      }

      if (settlement) {
        const loan: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(settlement.loan_id);
        if (loan) {
          const newRemaining = loan.remaining + settlement.amount;
          if (loan.status === 'settled') {
            db.prepare("UPDATE loans SET remaining = ?, status = 'active', settled_date = NULL WHERE id = ?").run(newRemaining, loan.id);
          } else {
            db.prepare("UPDATE loans SET remaining = ? WHERE id = ?").run(newRemaining, loan.id);
          }
          db.prepare("DELETE FROM loan_settlements WHERE id = ?").run(settlement.id);
        }
      }
    }

    const deleteTx = db.transaction(() => {
      if (transaction.linked_transaction_id) {
        db.prepare("DELETE FROM transactions WHERE id = ?").run(transaction.linked_transaction_id);
      }
      db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    });

    deleteTx();
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/category/rename", async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ error: "oldName and newName are required" });
    }

    if (supabase) {
      const { error } = await supabase
        .from("transactions")
        .update({ category: newName })
        .eq("category", oldName)
        .eq("user_id", req.user!.id);
      if (error) throw error;
      return res.json({ success: true });
    }

    db.prepare("UPDATE transactions SET category = ? WHERE category = ?").run(newName, oldName);
    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/transactions/category/rename error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
