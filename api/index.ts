import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { config } from "./config.js";

// Route Imports
import memberRoutes from "./routes/members.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import investmentRoutes from "./routes/investments.js";
import transferRoutes from "./routes/transfers.js";
import groupRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";

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

// --- API Routes ---

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const { username: validUsername, password: validPassword, tokenPrefix } = config.auth;

  if (username === validUsername && password === validPassword) {
    res.json({ success: true, token: tokenPrefix + Date.now() });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post("/api/login/guest", (_req, res) => {
  const { tokenPrefix } = config.auth;
  res.json({ success: true, token: tokenPrefix + Date.now() });
});

app.use("/api/members", memberRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/import", exportRoutes);

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
