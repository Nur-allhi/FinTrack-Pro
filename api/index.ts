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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
initDb();

const app = express();
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

app.use("/api/members", memberRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/groups", groupRoutes);

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
