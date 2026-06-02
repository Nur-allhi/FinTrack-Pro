-- Composite index for fast transaction queries
-- Speeds up: SELECT * FROM transactions
--   WHERE account_id = X AND user_id = Y AND deleted_at IS NULL
--   ORDER BY date DESC, id DESC LIMIT N
-- Without this index, PostgreSQL must full-scan all rows and sort before applying LIMIT,
-- causing 10-15s delays on accounts with many transactions.
CREATE INDEX IF NOT EXISTS idx_transactions_account_user_lookup
ON transactions (account_id, user_id, deleted_at, date DESC, id DESC);
