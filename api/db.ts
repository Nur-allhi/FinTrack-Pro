import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Vercel's temporary directory for the database
const dbPath = process.env.VERCEL ? `/tmp/data.db` : (process.env.DATABASE_URL || "data.db");
const dbDir = path.dirname(path.resolve(dbPath));

// Ensure directory exists for SQLite
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Using Supabase as the database.");
} else {
  console.log("Using local SQLite as the database. To use Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY.");
}

// Initialize SQLite Database (for fallback)
export const initDb = () => {
  console.log("[initDb] starting...");
  try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      relationship TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      member_id INTEGER,
      parent_id INTEGER,
      color TEXT DEFAULT '#1A5FCC',
      archived INTEGER DEFAULT 0,
      initial_balance REAL DEFAULT 0,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (parent_id) REFERENCES accounts(id)
    );



    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      particulars TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'normal',
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
  } catch (e) {
    console.error("initDb warning (non-fatal):", (e as any)?.message);
  }
};
