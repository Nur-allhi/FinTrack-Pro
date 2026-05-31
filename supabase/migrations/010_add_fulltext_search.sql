-- Full-text search indexes for FinTrack Pro
-- Adds tsvector columns and GIN indexes for fast text search

-- Transactions: search on particulars + category
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(particulars, '') || ' ' || coalesce(category, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_transactions_fts ON transactions USING gin(fts);

-- Accounts: search on name
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_accounts_fts ON accounts USING gin(fts);

-- Loans: search on borrower_name + particulars
ALTER TABLE loans ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(borrower_name, '') || ' ' || coalesce(particulars, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_loans_fts ON loans USING gin(fts);
