import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || "data.db";
const dbDir = path.dirname(path.resolve(dbPath));

// Ensure directory exists for SQLite
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Using Supabase as the database.");
} else {
  console.log("Using local SQLite as the database. To use Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY.");
}

// Initialize SQLite Database (for fallback)
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    relationship TEXT
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- cash, bank, mobile, investment, purpose, home_exp
    member_id INTEGER,
    color TEXT DEFAULT '#1A5FCC',
    archived INTEGER DEFAULT 0,
    initial_balance REAL DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    particulars TEXT NOT NULL,
    category TEXT,
    amount REAL NOT NULL, -- Positive for credit, negative for debit
    type TEXT DEFAULT 'normal', -- normal, transfer
    linked_transaction_id INTEGER,
    summary TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    principal REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS investment_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    percentage REAL,
    FOREIGN KEY (investment_id) REFERENCES investments(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Members
  app.get("/api/members", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("members").select("*");
        if (error) throw error;
        return res.json(data);
      }
      const members = db.prepare("SELECT * FROM members").all();
      res.json(members);
    } catch (err) {
      console.error("GET /api/members error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/members", async (req, res) => {
    console.log("POST /api/members body:", req.body);
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
    } catch (err) {
      console.error("POST /api/members error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    console.log("DELETE /api/members id:", req.params.id);
    try {
      if (supabase) {
        const { error } = await supabase.from("members").delete().eq("id", req.params.id);
        if (error) throw error;
        return res.json({ success: true });
      }
      db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/members error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      if (supabase) {
        // We'll fetch accounts and join with members manually or use a view
        // For simplicity, we'll fetch both and join
        const { data: accounts, error: accError } = await supabase.from("accounts").select("*, members(name)");
        if (accError) throw accError;
        
        // Fetch transactions to calculate balance
        const { data: transactions, error: txError } = await supabase.from("transactions").select("account_id, amount");
        if (txError) throw txError;

        const formatted = accounts.map(a => {
          const txSum = transactions.filter(t => t.account_id === a.id).reduce((sum, t) => sum + t.amount, 0);
          return {
            ...a,
            member_name: a.members?.name,
            current_balance: a.initial_balance + txSum
          };
        });
        return res.json(formatted);
      }

      const accounts = db.prepare(`
        SELECT a.*, m.name as member_name,
               (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as current_balance
        FROM accounts a 
        LEFT JOIN members m ON a.member_id = m.id
      `).all();
      res.json(accounts);
    } catch (err) {
      console.error("GET /api/accounts error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    console.log("POST /api/accounts body:", req.body);
    try {
      const { name, type, member_id, color, initial_balance } = req.body;
      if (!name || !type) return res.status(400).json({ error: "Name and type are required" });
      
      if (supabase) {
        const { data, error } = await supabase.from("accounts").insert([{ 
          name, type, member_id, color, initial_balance: initial_balance || 0 
        }]).select().single();
        if (error) throw error;
        return res.json(data);
      }

      const info = db.prepare("INSERT INTO accounts (name, type, member_id, color, initial_balance) VALUES (?, ?, ?, ?, ?)").run(name, type, member_id, color, initial_balance || 0);
      res.json({ id: info.lastInsertRowid, name, type, member_id, color, initial_balance });
    } catch (err) {
      console.error("POST /api/accounts error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    console.log("PATCH /api/accounts id:", req.params.id, "body:", req.body);
    try {
      const { name, color, archived } = req.body;
      
      if (supabase) {
        const update: any = {};
        if (name !== undefined) update.name = name;
        if (color !== undefined) update.color = color;
        if (archived !== undefined) update.archived = archived;
        
        const { error } = await supabase.from("accounts").update(update).eq("id", req.params.id);
        if (error) throw error;
        return res.json({ success: true });
      }

      db.prepare("UPDATE accounts SET name = COALESCE(?, name), color = COALESCE(?, color), archived = COALESCE(?, archived) WHERE id = ?").run(name, color, archived, req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("PATCH /api/accounts error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Transactions
  app.get("/api/transactions/:accountId", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("transactions").select("*").eq("account_id", req.params.accountId).order("date", { ascending: false }).order("id", { ascending: false });
        if (error) throw error;
        return res.json(data);
      }
      const transactions = db.prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC, id DESC").all(req.params.accountId);
      res.json(transactions);
    } catch (err) {
      console.error("GET /api/transactions error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    console.log("POST /api/transactions body:", req.body);
    try {
      const { account_id, date, particulars, category, amount, type, linked_transaction_id, summary } = req.body;
      if (!account_id || !date || !particulars || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (supabase) {
        const { data, error } = await supabase.from("transactions").insert([{
          account_id, date, particulars, category, amount, type: type || 'normal', linked_transaction_id, summary
        }]).select().single();
        if (error) throw error;
        return res.json(data);
      }

      const info = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(account_id, date, particulars, category, amount, type || 'normal', linked_transaction_id, summary);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      console.error("POST /api/transactions error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    console.log("DELETE /api/transactions id:", req.params.id);
    try {
      if (supabase) {
        const { data: transaction, error: fetchError } = await supabase.from("transactions").select("*").eq("id", req.params.id).single();
        if (fetchError) throw fetchError;

        if (transaction && transaction.linked_transaction_id) {
          await supabase.from("transactions").delete().eq("id", transaction.linked_transaction_id);
        }
        const { error: delError } = await supabase.from("transactions").delete().eq("id", req.params.id);
        if (delError) throw delError;
        return res.json({ success: true });
      }

      const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
      if (transaction && transaction.linked_transaction_id) {
          db.prepare("DELETE FROM transactions WHERE id = ?").run(transaction.linked_transaction_id);
      }
      db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/transactions error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Transfers
  app.post("/api/transfers", async (req, res) => {
    console.log("POST /api/transfers body:", req.body);
    try {
      const { from_account_id, to_account_id, date, amount, particulars } = req.body;
      if (!from_account_id || !to_account_id || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (supabase) {
        // Supabase doesn't support transactions in the same way, we'll do sequential inserts
        // In a real app, you'd use a RPC function for atomicity
        const { data: debit, error: dError } = await supabase.from("transactions").insert([{
          account_id: from_account_id, date, particulars: `Transfer to: ${particulars}`, category: 'Transfer', amount: -amount, type: 'transfer'
        }]).select().single();
        if (dError) throw dError;

        const { data: credit, error: cError } = await supabase.from("transactions").insert([{
          account_id: to_account_id, date, particulars: `Transfer from: ${particulars}`, category: 'Transfer', amount: amount, type: 'transfer', linked_transaction_id: debit.id
        }]).select().single();
        if (cError) throw cError;

        await supabase.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id);
        
        return res.json({ debitId: debit.id, creditId: credit.id });
      }

      const transfer = db.transaction(() => {
          // Debit from source
          const debitInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)").run(from_account_id, date, `Transfer to: ${particulars}`, 'Transfer', -amount, 'transfer');
          const debitId = debitInfo.lastInsertRowid;

          // Credit to destination
          const creditInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(to_account_id, date, `Transfer from: ${particulars}`, 'Transfer', amount, 'transfer', debitId);
          const creditId = creditInfo.lastInsertRowid;

          // Link debit to credit
          db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
          
          return { debitId, creditId };
      });

      res.json(transfer());
    } catch (err) {
      console.error("POST /api/transfers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Investments
  app.get("/api/investments", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("investments").select("*, accounts(name)");
        if (error) throw error;
        const formatted = data.map(i => ({
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
    } catch (err) {
      console.error("GET /api/investments error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/investments/:id/returns", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("investment_returns").select("*").eq("investment_id", req.params.id).order("date", { ascending: false });
        if (error) throw error;
        return res.json(data);
      }
      const returns = db.prepare("SELECT * FROM investment_returns WHERE investment_id = ? ORDER BY date DESC").all(req.params.id);
      res.json(returns);
    } catch (err) {
      console.error("GET /api/investments/:id/returns error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/investments", async (req, res) => {
    console.log("POST /api/investments body:", req.body);
    try {
      const { account_id, principal, date } = req.body;
      
      if (supabase) {
        const { data, error } = await supabase.from("investments").insert([{ account_id, principal, date }]).select().single();
        if (error) throw error;
        return res.json(data);
      }

      const info = db.prepare("INSERT INTO investments (account_id, principal, date) VALUES (?, ?, ?)").run(account_id, principal, date);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      console.error("POST /api/investments error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/investments/:id/returns", async (req, res) => {
    console.log("POST /api/investments/:id/returns body:", req.body);
    try {
      const { date, amount, percentage } = req.body;
      
      if (supabase) {
        const { data, error } = await supabase.from("investment_returns").insert([{ investment_id: req.params.id, date, amount, percentage }]).select().single();
        if (error) throw error;
        return res.json(data);
      }

      const info = db.prepare("INSERT INTO investment_returns (investment_id, date, amount, percentage) VALUES (?, ?, ?, ?)").run(req.params.id, date, amount, percentage);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      console.error("POST /api/investments/:id/returns error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
