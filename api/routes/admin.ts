import express from "express";
import { supabaseAdmin } from "../db.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin!.auth.admin.listUsers();
    if (error) throw error;
    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      provider: u.app_metadata?.provider || 'email',
    }));
    res.json(users);
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { data, error } = await supabaseAdmin!.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { provider: 'email' },
    });
    if (error) throw error;

    res.json({
      success: true,
      user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at }
    });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    if (err.message?.includes('already registered')) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin!.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/users error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
