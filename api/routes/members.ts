import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("members").select("*");
      if (error) throw error;
      return res.json(data);
    }
    const members = db.prepare("SELECT * FROM members").all();
    res.json(members);
  } catch (err: any) {
    console.error("GET /api/members error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, relationship } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    if (supabase) {
      const { data, error } = await supabase.from("members").insert([{ name, relationship }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO members (name, relationship) VALUES (?, ?)").run(name, relationship);
    res.json({ id: info.lastInsertRowid, name, relationship });
  } catch (err: any) {
    console.error("POST /api/members error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase.from("members").delete().eq("id", req.params.id);
      if (error) throw error;
      return res.json({ success: true });
    }
    db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/members error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
