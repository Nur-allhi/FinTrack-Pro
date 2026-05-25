import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client — primary database (anon key — used for data queries)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Supabase Admin Client (service_role key — used only for JWT verification in auth middleware)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

let _db: any = null;

// Lazy SQLite init — never crashes; if it fails, app uses Supabase only
async function initSqlite() {
  try {
    const { default: Database } = await import("better-sqlite3");
    const dbPath = process.env.VERCEL ? `/tmp/data.db` : (process.env.DATABASE_URL || "data.db");
    const dbDir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    _db = new Database(dbPath);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, relationship TEXT);
      CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, member_id INTEGER, parent_id INTEGER, color TEXT DEFAULT '#1A5FCC', archived INTEGER DEFAULT 0, initial_balance REAL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, date TEXT NOT NULL, particulars TEXT NOT NULL, category TEXT, amount REAL NOT NULL, type TEXT DEFAULT 'normal', linked_transaction_id INTEGER, summary TEXT);
      CREATE TABLE IF NOT EXISTS investments (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, principal REAL NOT NULL, date TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS investment_returns (id INTEGER PRIMARY KEY AUTOINCREMENT, investment_id INTEGER NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, percentage REAL);
      CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, lender_account_id INTEGER NOT NULL, borrower_account_id INTEGER, amount REAL NOT NULL, date_given TEXT NOT NULL, due_date TEXT, interest_rate REAL, particulars TEXT, status TEXT DEFAULT 'active', settled_date TEXT, borrower_name TEXT, remaining REAL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS loan_settlements (id INTEGER PRIMARY KEY AUTOINCREMENT, loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE, amount REAL NOT NULL, date TEXT NOT NULL, notes TEXT DEFAULT '', user_id TEXT, transaction_id INTEGER);
    `);
    try { _db.exec("ALTER TABLE loans ADD COLUMN borrower_name TEXT"); } catch {}
    try { _db.exec("ALTER TABLE loans ADD COLUMN remaining REAL DEFAULT 0"); } catch {}
    try { _db.exec("UPDATE loans SET remaining = amount WHERE remaining IS NULL OR remaining = 0"); } catch {}
    try { _db.exec("ALTER TABLE loan_settlements ADD COLUMN transaction_id INTEGER"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_loans_lender_account_id ON loans(lender_account_id)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_loans_borrower_account_id ON loans(borrower_account_id)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_loan_settlements_loan_id ON loan_settlements(loan_id)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_investments_account_id ON investments(account_id)"); } catch {}
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_investment_returns_investment_id ON investment_returns(investment_id)"); } catch {}
  } catch (e) {
    console.warn("SQLite unavailable (non-fatal):", (e as any)?.message);
  }
}

export { _db as db };

// Initialize database — Supabase first, SQLite fallback
export const initDb = async () => {
  if (supabase) {
    console.log("Using Supabase as the database.");
    // Still try SQLite for routes that need it (export/import/clear-all with raw SQL)
    await initSqlite();
  } else {
    await initSqlite();
    if (_db) {
      console.log("Using local SQLite as the database. To use Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY.");
    } else {
      console.error("No database available. Set SUPABASE_URL and SUPABASE_ANON_KEY or install better-sqlite3.");
    }
  }
};
