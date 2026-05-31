-- Add currency column to accounts for multi-currency support
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Index for currency-based queries
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
