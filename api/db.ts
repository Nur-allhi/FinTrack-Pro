import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client — primary database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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
    `);
  } catch (e) {
    console.warn("SQLite unavailable (non-fatal):", (e as any)?.message);
  }
}

export const db = _db;

// Initialize database — Supabase first, SQLite fallback
export const initDb = async () => {
  if (supabase) {
    console.log("Using Supabase as the database.");
    // Still try SQLite for routes that need it (export/import/clear-all with raw SQL)
    await initSqlite();
  } else {
    await initSqlite();
    if (db) {
      console.log("Using local SQLite as the database. To use Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY.");
    } else {
      console.error("No database available. Set SUPABASE_URL and SUPABASE_ANON_KEY or install better-sqlite3.");
    }
  }
};
