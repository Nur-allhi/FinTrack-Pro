import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, supabase } from "./db.js";
import { requireAuth, setSessionCookie, clearSessionCookie } from "./middleware/auth.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/error.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLogger } from "./logger.js";

import memberRoutes from "./routes/members.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import investmentRoutes from "./routes/investments.js";
import transferRoutes from "./routes/transfers.js";
import loanRoutes from "./routes/loans.js";
import groupRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";
import recyclebinRoutes from "./routes/recyclebin.js";
import searchRoutes from "./routes/search.js";
import budgetRoutes from "./routes/budgets.js";
import recurringRoutes from "./routes/recurring.js";
import syncRoutes from "./routes/sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const startup = initDb().catch(e => console.error("Startup error:", e));

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await startup;
  next();
});

app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    setSessionCookie(res, access_token);
    res.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
      access_token
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ error: message });
  }
});

app.post("/api/auth/session", async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error) {
      clearSessionCookie(res);
      return res.status(401).json({ error: error.message });
    }
    setSessionCookie(res, access_token);
    res.json({ success: true, user: { id: data.user.id, email: data.user.email } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("POST /api/auth/session error:", err);
    res.status(500).json({ error: message });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

app.get("/api/auth/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api", apiLimiter);
app.use("/api/members", requireAuth, memberRoutes);
app.use("/api/accounts", requireAuth, accountRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/investments", requireAuth, investmentRoutes);
app.use("/api/transfers", requireAuth, transferRoutes);
app.use("/api/loans", requireAuth, loanRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api/recyclebin", requireAuth, recyclebinRoutes);
app.use("/api/export", requireAuth, exportRoutes);
app.use("/api/import", requireAuth, exportRoutes);
app.use("/api/search", requireAuth, searchRoutes);
app.use("/api/budgets", requireAuth, budgetRoutes);
app.use("/api/recurring", requireAuth, recurringRoutes);
app.use("/api/sync", requireAuth, syncRoutes);

app.use(errorHandler);

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
