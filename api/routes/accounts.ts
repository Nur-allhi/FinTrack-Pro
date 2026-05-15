import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data: accounts, error: accError } = await supabase.from("accounts").select("*, members(name), parents:parent_id(name)").eq("user_id", req.user!.id);
      if (accError) throw accError;
      
      const { data: transactions, error: txError } = await supabase.from("transactions").select("account_id, amount").eq("user_id", req.user!.id);
      if (txError) throw txError;

      const formatted = accounts
        .filter((a: any) => a.type !== 'group')
        .map((a: any) => {
          const txSum = transactions.filter(t => t.account_id === a.id).reduce((sum, t) => sum + Number(t.amount), 0);
          return {
            ...a,
            member_name: a.members?.name,
            parent_name: a.parents?.name,
            current_balance: Number(a.initial_balance) + txSum
          };
        });
      return res.json(formatted);
    }

    const accounts = db.prepare(`
      SELECT a.*, m.name as member_name, p.name as parent_name,
             (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as current_balance
      FROM accounts a 
      LEFT JOIN members m ON a.member_id = m.id
      LEFT JOIN accounts p ON a.parent_id = p.id
      WHERE a.type != 'group'
    `).all();
    res.json(accounts);
  } catch (err: any) {
    console.error("GET /api/accounts error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, type, member_id, parent_id, color, initial_balance } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Name and type are required" });
    
    if (supabase) {
      const { data, error } = await supabase.from("accounts").insert([{ 
        name, type, member_id, parent_id, color, initial_balance: initial_balance || 0,
        user_id: req.user!.id
      }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO accounts (name, type, member_id, parent_id, color, initial_balance) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, type, member_id, parent_id, color, initial_balance || 0);
    res.json({ id: info.lastInsertRowid, name, type, member_id, parent_id, color, initial_balance });
  } catch (err: any) {
    console.error("POST /api/accounts error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, color, archived, type, member_id, parent_id, initial_balance } = req.body;
    
    if (supabase) {
      const update: any = {};
      if (name !== undefined) update.name = name;
      if (color !== undefined) update.color = color;
      if (archived !== undefined) update.archived = archived;
      if (type !== undefined) update.type = type;
      if (member_id !== undefined) update.member_id = member_id;
      if (parent_id !== undefined) update.parent_id = parent_id;
      if (initial_balance !== undefined) update.initial_balance = initial_balance;
      
      const { error } = await supabase.from("accounts").update(update).eq("id", req.params.id).eq("user_id", req.user!.id);
      if (error) throw error;
      return res.json({ success: true });
    }

    db.prepare(`
      UPDATE accounts SET 
        name = COALESCE(?, name), 
        color = COALESCE(?, color), 
        archived = COALESCE(?, archived),
        type = COALESCE(?, type),
        member_id = COALESCE(?, member_id),
        parent_id = COALESCE(?, parent_id),
        initial_balance = COALESCE(?, initial_balance)
      WHERE id = ?
    `).run(name, color, archived, type, member_id, parent_id, initial_balance, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/accounts error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
