import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, supabase, supabaseAdmin } from "./db.js";
import { config } from "./config.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";

// Route Imports
import memberRoutes from "./routes/members.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import investmentRoutes from "./routes/investments.js";
import transferRoutes from "./routes/transfers.js";
import groupRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize database asynchronously — Vercel cold start waits for this
const startup = initDb().catch(e => console.error("Startup error:", e));

// Middleware that waits for DB init before processing requests
app.use(async (_req: any, _res: any, next: any) => {
  await startup;
  next();
});
app.use(express.json());

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// --- Auth Routes ---

// Validate a Supabase JWT and return the user session (replaces old login)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }
    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase Auth not configured — set SUPABASE_SERVICE_ROLE_KEY" });
    }
    const { data, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    res.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
      access_token
    });
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public Supabase config for frontend (anon key is safe to expose)
app.get("/api/auth/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

// Get current user info (requires valid JWT)
app.get("/api/auth/me", requireAuth, (req, res) => {
  const isAdmin = req.user?.email ? config.admin.emails.includes(req.user.email.toLowerCase()) : false;
  res.json({ user: req.user, isAdmin });
});

// Apply auth middleware to all data routes
app.use("/api/members", requireAuth, memberRoutes);
app.use("/api/accounts", requireAuth, accountRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/investments", requireAuth, investmentRoutes);
app.use("/api/transfers", requireAuth, transferRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api/export", requireAuth, exportRoutes);
app.use("/api/import", exportRoutes);

// Admin routes (auth + admin check)
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);

// Serve static files in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.resolve(__dirname, '../dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  });
}

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
