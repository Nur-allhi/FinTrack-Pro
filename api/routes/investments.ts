import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("investments").select("*, accounts(name)");
      if (error) throw error;
      const formatted = data.map((i: any) => ({
        ...i,
        account_name: i.accounts?.name
      }));
      return res.json(formatted);
    }
    const investments = db.prepare(`
        SELECT i.*, a.name as account_name 
        FROM investments i
        JOIN accounts a ON i.account_id = a.id
    `).all();
    res.json(investments);
  } catch (err: any) {
    console.error("GET /api/investments error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/returns", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("investment_returns").select("*").eq("investment_id", req.params.id).order("date", { ascending: false });
      if (error) throw error;
      return res.json(data);
    }
    const returns = db.prepare("SELECT * FROM investment_returns WHERE investment_id = ? ORDER BY date DESC").all(req.params.id);
    res.json(returns);
  } catch (err: any) {
    console.error("GET /api/investments/:id/returns error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { account_id, principal, date } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase.from("investments").insert([{ account_id, principal, date }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO investments (account_id, principal, date) VALUES (?, ?, ?)").run(account_id, principal, date);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    console.error("POST /api/investments error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/returns", async (req, res) => {
  try {
    const { date, amount, percentage } = req.body;
    
    if (supabase) {
      const { data, error } = await supabase.from("investment_returns").insert([{ investment_id: req.params.id, date, amount, percentage }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO investment_returns (investment_id, date, amount, percentage) VALUES (?, ?, ?, ?)").run(req.params.id, date, amount, percentage);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    console.error("POST /api/investments/:id/returns error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
