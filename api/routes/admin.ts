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
      name: u.user_metadata?.name || '',
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
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { data, error } = await supabaseAdmin!.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { provider: 'email', name: name || '' },
    });
    if (error) throw error;

    res.json({
      success: true,
      password,
      user: { id: data.user.id, email: data.user.email, name: name || '', created_at: data.user.created_at }
    });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    if (err.message?.includes('already registered')) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { error } = await supabaseAdmin!.auth.admin.updateUserById(req.params.id, { password });
    if (error) throw error;

    res.json({ success: true, password });
  } catch (err: any) {
    console.error("POST /api/admin/users/:id/reset-password error:", err);
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

router.get("/users/:id/storage", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!supabaseAdmin) {
      return res.json({ totalBytes: 0, totalKB: 0, limitKB: 5120, tables: {}, note: 'Supabase admin not configured' });
    }

    const estimateRowBytes = (rows: number, cols: number, avgBytesPerCol: number) => rows * cols * avgBytesPerCol;

    const tableDefs = [
      { name: 'members', cols: 4, bytesPerCol: 32 },
      { name: 'accounts', cols: 9, bytesPerCol: 40 },
      { name: 'transactions', cols: 9, bytesPerCol: 64 },
      { name: 'investments', cols: 4, bytesPerCol: 32 },
      { name: 'investment_returns', cols: 5, bytesPerCol: 32 },
    ];

    const results: Record<string, { rows: number; bytes: number }> = {};
    let totalBytes = 0;

    for (const table of tableDefs) {
      try {
        const countResult = await supabaseAdmin
          .from(table.name)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const rowCount = countResult.count || 0;
        const bytes = estimateRowBytes(rowCount, table.cols, table.bytesPerCol);
        results[table.name] = { rows: rowCount, bytes };
        totalBytes += bytes;
      } catch {
        results[table.name] = { rows: 0, bytes: 0 };
      }
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const storageLimitMb = userData?.user?.user_metadata?.storage_limit_mb || 5;

    res.json({
      totalBytes,
      totalKB: +(totalBytes / 1024).toFixed(1),
      limitKB: storageLimitMb * 1024,
      tables: results,
    });
  } catch (err: any) {
    console.error("GET /api/admin/users/:id/storage error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/storage/summary", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.json({ totalMB: 0, tables: {}, note: 'Supabase admin not configured' });
    }

    const tableDefs = [
      { name: 'members', cols: 4, bytesPerCol: 32 },
      { name: 'accounts', cols: 9, bytesPerCol: 40 },
      { name: 'transactions', cols: 9, bytesPerCol: 64 },
      { name: 'investments', cols: 4, bytesPerCol: 32 },
      { name: 'investment_returns', cols: 5, bytesPerCol: 32 },
    ];

    const results: Record<string, { rows: number; bytes: number }> = {};
    let totalBytes = 0;

    for (const table of tableDefs) {
      try {
        const { count } = await supabaseAdmin
          .from(table.name)
          .select('id', { count: 'exact', head: true });

        const rows = (count || 0) - ((count || 0) % 10);
        const bytes = rows * table.cols * table.bytesPerCol;
        results[table.name] = { rows, bytes };
        totalBytes += bytes;
      } catch {
        results[table.name] = { rows: 0, bytes: 0 };
      }
    }

    res.json({
      totalMB: +(totalBytes / 1024 / 1024).toFixed(2),
      totalKB: +(totalBytes / 1024).toFixed(0),
      totalBytes,
      tables: results,
    });
  } catch (err: any) {
    console.error("GET /api/admin/storage/summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { storage_limit_mb } = req.body;

    if (storage_limit_mb === undefined) {
      return res.status(400).json({ error: "storage_limit_mb is required" });
    }
    if (storage_limit_mb < 1 || storage_limit_mb > 100) {
      return res.status(400).json({ error: "Storage limit must be between 1 and 100 MB" });
    }

    const { data: existing } = await supabaseAdmin!.auth.admin.getUserById(req.params.id);
    const currentMetadata = existing?.user?.user_metadata || {};

    const { error } = await supabaseAdmin!.auth.admin.updateUserById(req.params.id, {
      user_metadata: { ...currentMetadata, storage_limit_mb },
    });
    if (error) throw error;

    res.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/admin/users/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
