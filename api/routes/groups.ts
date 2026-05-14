import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data: groups, error } = await supabase
        .from("accounts")
        .select("*, members(name)")
        .eq("type", "group")
        .order("name");
      if (error) throw error;

      const { data: children, error: cError } = await supabase
        .from("accounts")
        .select("id, parent_id, name, type, initial_balance, archived, member_id")
        .not("parent_id", "is", null);
      if (cError) throw cError;

      const { data: allTx, error: txErr } = await supabase.from("transactions").select("account_id, amount");
      if (txErr) throw txErr;

      const balances: Record<number, number> = {};
      for (const tx of (allTx || [])) {
        balances[tx.account_id] = (balances[tx.account_id] || 0) + Number(tx.amount);
      }

      const result = (groups || []).map((g: any) => {
        const childAccounts = (children || []).filter((c: any) => c.parent_id === g.id && !c.archived);
        return {
          ...g,
          member_name: g.members?.name,
          child_count: childAccounts.length,
          accumulated_balance: childAccounts.reduce((sum: number, c: any) => sum + Number(c.initial_balance || 0) + (balances[c.id] || 0), 0),
          children: childAccounts.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            current_balance: Number(c.initial_balance || 0) + (balances[c.id] || 0)
          }))
        };
      });
      return res.json(result);
    }

    const groups = db.prepare(`
      SELECT g.*, m.name as member_name,
        COUNT(c.id) as child_count,
        COALESCE(SUM(c.child_balance), 0) as accumulated_balance
      FROM accounts g
      LEFT JOIN (
        SELECT a.id, a.parent_id, a.archived,
          (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as child_balance
        FROM accounts a
      ) c ON c.parent_id = g.id AND c.archived = 0
      LEFT JOIN members m ON g.member_id = m.id
      WHERE g.type = 'group'
      GROUP BY g.id
      ORDER BY g.name
    `).all();

    const withChildren = (groups as any[]).map(g => {
      const children = db.prepare(`
        SELECT a.*, m.name as member_name,
          (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as current_balance
        FROM accounts a
        LEFT JOIN members m ON a.member_id = m.id
        WHERE a.parent_id = ?
        ORDER BY a.name
      `).all(g.id);
      return { ...g, children };
    });

    res.json(withChildren);
  } catch (err: any) {
    console.error("GET /api/groups error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, member_id, color } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    if (supabase) {
      const { data, error } = await supabase.from("accounts").insert([{
        name, type: 'group', member_id, color, initial_balance: 0
      }]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    const info = db.prepare("INSERT INTO accounts (name, type, member_id, color, initial_balance) VALUES (?, 'group', ?, ?, 0)")
      .run(name, member_id, color);
    res.json({ id: info.lastInsertRowid, name, type: 'group', member_id, color });
  } catch (err: any) {
    console.error("POST /api/groups error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, color, member_id } = req.body;

    if (supabase) {
      const update: any = {};
      if (name !== undefined) update.name = name;
      if (color !== undefined) update.color = color;
      if (member_id !== undefined) update.member_id = member_id;
      const { error } = await supabase.from("accounts").update(update).eq("id", req.params.id);
      if (error) throw error;
      return res.json({ success: true });
    }

    db.prepare(`
      UPDATE accounts SET name = COALESCE(?, name), color = COALESCE(?, color), member_id = COALESCE(?, member_id)
      WHERE id = ? AND type = 'group'
    `).run(name, color, member_id, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/groups error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (supabase) {
      await supabase.from("accounts").update({ parent_id: null }).eq("parent_id", req.params.id);
      const { error } = await supabase.from("accounts").delete().eq("id", req.params.id).eq("type", "group");
      if (error) throw error;
      return res.json({ success: true });
    }

    db.transaction(() => {
      db.prepare("UPDATE accounts SET parent_id = NULL WHERE parent_id = ?").run(req.params.id);
      db.prepare("DELETE FROM accounts WHERE id = ? AND type = 'group'").run(req.params.id);
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/groups error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
