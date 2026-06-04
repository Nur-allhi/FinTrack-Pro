-- =============================================================
-- Migration: Three-Layer Alignment — Schema Fixes
-- Run ALL of these in Supabase SQL Editor (Dashboard > SQL Editor)
-- Date: 2026-06-04
-- =============================================================

-- ─── 0.1 Verify existing columns ──────────────────────────────
-- These should already exist from migration 015.
-- If any fail with "column does not exist", run the ALTER.

-- client_id columns (should exist on all)
SELECT column_name, table_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND column_name = 'client_id'
 ORDER BY table_name;

-- updated_at columns (should exist on all)
SELECT column_name, table_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND column_name = 'updated_at'
 ORDER BY table_name;

-- ─── 0.2 Add deleted_at to tables that are missing it ────────
-- Currently only on: transactions, accounts, loans
ALTER TABLE members              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE investments          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE investment_returns   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE budgets              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_members_deleted_at            ON members(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investments_deleted_at         ON investments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investment_returns_deleted_at  ON investment_returns(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_deleted_at             ON budgets(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_deleted_at ON recurring_transactions(deleted_at) WHERE deleted_at IS NOT NULL;

-- ─── 0.3 Add user_id to investment_returns ───────────────────
ALTER TABLE investment_returns ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing rows with default (you may need to adjust this)
-- UPDATE investment_returns ir SET user_id = i.user_id
--   FROM investments i WHERE ir.investment_id = i.id AND ir.user_id IS NULL;

ALTER TABLE investment_returns ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investment_returns_user_id ON investment_returns(user_id);

-- ─── 0.4 Add user_id to loan_settlements if missing ──────────
ALTER TABLE loan_settlements ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE loan_settlements ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loan_settlements_user_id ON loan_settlements(user_id);

-- ─── 0.5 Add client_id + updated_at to sync_log ─────────────
-- Already exists from migration 015, but add if missing
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── 0.6 Diagnostic: find records without client_id ──────────
-- These were created before sync fields were added.
-- They need client_id assigned for sync to work.
SELECT 'members' AS tbl, COUNT(*) AS count FROM members WHERE client_id IS NULL
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts WHERE client_id IS NULL
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions WHERE client_id IS NULL
UNION ALL
SELECT 'loans', COUNT(*) FROM loans WHERE client_id IS NULL
UNION ALL
SELECT 'loan_settlements', COUNT(*) FROM loan_settlements WHERE client_id IS NULL
UNION ALL
SELECT 'investments', COUNT(*) FROM investments WHERE client_id IS NULL
UNION ALL
SELECT 'investment_returns', COUNT(*) FROM investment_returns WHERE client_id IS NULL
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets WHERE client_id IS NULL
UNION ALL
SELECT 'recurring_transactions', COUNT(*) FROM recurring_transactions WHERE client_id IS NULL
ORDER BY tbl;

-- ─── 0.7 Verify all tables have correct columns ──────────────
-- Run this to see the full schema after all changes
SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN (
     'members', 'accounts', 'transactions', 'loans',
     'loan_settlements', 'investments', 'investment_returns',
     'budgets', 'recurring_transactions', 'sync_log'
   )
 ORDER BY table_name, ordinal_position;
