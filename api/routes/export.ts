import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const [members, accounts, transactions, investments, returns] = await Promise.all([
        supabase.from("members").select("*").eq("user_id", req.user!.id),
        supabase.from("accounts").select("*").eq("user_id", req.user!.id),
        supabase.from("transactions").select("*").eq("user_id", req.user!.id),
        supabase.from("investments").select("*").eq("user_id", req.user!.id),
        supabase.from("investment_returns").select("*"),
      ]);
      return res.json({
        members: members.data || [],
        accounts: accounts.data || [],
        transactions: transactions.data || [],
        investments: investments.data || [],
        investmentReturns: returns.data || [],
      });
    }

    const members = db.prepare("SELECT * FROM members").all();
    const accounts = db.prepare("SELECT * FROM accounts").all();
    const transactions = db.prepare("SELECT * FROM transactions").all();
    const investments = db.prepare("SELECT * FROM investments").all();
    const investmentReturns = db.prepare("SELECT * FROM investment_returns").all();

    res.json({ members, accounts, transactions, investments, investmentReturns });
  } catch (err: any) {
    console.error("GET /api/export error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { members, accounts, transactions, investments, investmentReturns } = req.body;

    if (supabase) {
      if (members?.length) await supabase.from("members").delete().eq("user_id", req.user!.id);
      if (accounts?.length) await supabase.from("accounts").delete().eq("user_id", req.user!.id);
      if (transactions?.length) await supabase.from("transactions").delete().eq("user_id", req.user!.id);
      if (investments?.length) await supabase.from("investments").delete().eq("user_id", req.user!.id);
      if (investmentReturns?.length) await supabase.from("investment_returns").delete().neq("id", 0);

      if (members?.length) {
        const { error } = await supabase.from("members").insert(members.map((m: any) => ({ ...m, user_id: req.user!.id })));
        if (error) throw error;
      }
      if (accounts?.length) {
        const { error } = await supabase.from("accounts").insert(accounts.map((a: any) => ({ ...a, user_id: req.user!.id })));
        if (error) throw error;
      }
      if (transactions?.length) {
        const { error } = await supabase.from("transactions").insert(transactions.map((t: any) => ({ ...t, user_id: req.user!.id })));
        if (error) throw error;
      }
      if (investments?.length) {
        const { error } = await supabase.from("investments").insert(investments.map((i: any) => ({ ...i, user_id: req.user!.id })));
        if (error) throw error;
      }
      if (investmentReturns?.length) {
        const { error } = await supabase.from("investment_returns").insert(investmentReturns);
        if (error) throw error;
      }
      return res.json({ success: true });
    }

    const doImport = db.transaction(() => {
      db.prepare("DELETE FROM investment_returns").run();
      db.prepare("DELETE FROM investments").run();
      db.prepare("DELETE FROM transactions").run();
      db.prepare("DELETE FROM accounts").run();
      db.prepare("DELETE FROM members").run();

      if (members) {
        const stmt = db.prepare("INSERT INTO members (id, name, relationship) VALUES (?, ?, ?)");
        for (const m of members) stmt.run(m.id, m.name, m.relationship);
      }

      if (accounts) {
        const stmt = db.prepare("INSERT INTO accounts (id, name, type, member_id, parent_id, color, archived, initial_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const a of accounts) stmt.run(a.id, a.name, a.type, a.member_id, a.parent_id, a.color, a.archived || 0, a.initial_balance || 0);
      }

      if (transactions) {
        const stmt = db.prepare("INSERT INTO transactions (id, account_id, date, particulars, category, amount, type, linked_transaction_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        for (const t of transactions) stmt.run(t.id, t.account_id, t.date, t.particulars, t.category, t.amount, t.type || 'normal', t.linked_transaction_id, t.summary);
      }

      if (investments) {
        const stmt = db.prepare("INSERT INTO investments (id, account_id, principal, date) VALUES (?, ?, ?, ?)");
        for (const i of investments) stmt.run(i.id, i.account_id, i.principal, i.date);
      }

      if (investmentReturns) {
        const stmt = db.prepare("INSERT INTO investment_returns (id, investment_id, date, amount, percentage) VALUES (?, ?, ?, ?, ?)");
        for (const r of investmentReturns) stmt.run(r.id, r.investment_id, r.date, r.amount, r.percentage);
      }
    });

    doImport();
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/import error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/clear-all", async (req, res) => {
  try {
    if (supabase) {
      await Promise.all([
        supabase.from("investment_returns").delete().neq("id", 0),
        supabase.from("investments").delete().eq("user_id", req.user!.id),
        supabase.from("transactions").delete().eq("user_id", req.user!.id),
        supabase.from("accounts").delete().eq("user_id", req.user!.id),
        supabase.from("members").delete().eq("user_id", req.user!.id),
      ]);
      return res.json({ success: true });
    }

    const doClear = db.transaction(() => {
      db.prepare("DELETE FROM investment_returns").run();
      db.prepare("DELETE FROM investments").run();
      db.prepare("DELETE FROM transactions").run();
      db.prepare("DELETE FROM accounts").run();
      db.prepare("DELETE FROM members").run();
    });

    doClear();
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/export/clear-all error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
