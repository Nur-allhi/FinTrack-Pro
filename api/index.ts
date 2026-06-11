import express, { Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";
import { initDb, supabase } from "./db.js";
import { requireAuth, setSessionCookie, clearSessionCookie } from "./middleware/auth.js";
import { csrfProtection } from "./middleware/csrf.js";
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

// Trust first proxy (for rate limiter behind reverse proxy)
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const startup = initDb().catch(e => console.error("Startup error:", e));

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await startup;
  next();
});

app.use(helmet());
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.post("/api/auth/login", authLimiter, csrfProtection, async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    setSessionCookie(req, res, access_token);
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

app.post("/api/auth/session", authLimiter, csrfProtection, async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error) {
      clearSessionCookie(req, res);
      return res.status(401).json({ error: error.message });
    }
    setSessionCookie(req, res, access_token);
    res.json({ success: true, user: { id: data.user.id, email: data.user.email } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("POST /api/auth/session error:", err);
    res.status(500).json({ error: message });
  }
});

app.post("/api/auth/logout", csrfProtection, (req, res) => {
  clearSessionCookie(req, res);
  res.json({ success: true });
});

app.get("/api/auth/me", requireAuth, csrfProtection, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api", apiLimiter);
app.use("/api/members", requireAuth, csrfProtection, memberRoutes);
app.use("/api/accounts", requireAuth, csrfProtection, accountRoutes);
app.use("/api/transactions", requireAuth, csrfProtection, transactionRoutes);
app.use("/api/investments", requireAuth, csrfProtection, investmentRoutes);
app.use("/api/transfers", requireAuth, csrfProtection, transferRoutes);
app.use("/api/loans", requireAuth, csrfProtection, loanRoutes);
app.use("/api/groups", requireAuth, csrfProtection, groupRoutes);
app.use("/api/recyclebin", requireAuth, csrfProtection, recyclebinRoutes);
app.use("/api/export", requireAuth, csrfProtection, exportRoutes);
app.use("/api/import", requireAuth, csrfProtection, exportRoutes);
app.use("/api/search", requireAuth, csrfProtection, searchRoutes);
app.use("/api/budgets", requireAuth, csrfProtection, budgetRoutes);
app.use("/api/recurring", requireAuth, csrfProtection, recurringRoutes);
app.use("/api/sync", requireAuth, csrfProtection, syncRoutes);

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
