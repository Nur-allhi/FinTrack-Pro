-- Migration: Add UUID sync fields for local-first architecture
-- Adds client_id UUID for sync mapping and updated_at for conflict resolution.
-- Existing RLS policies (from 007_enable_rls_all_tables.sql) already protect
-- all rows via auth.uid() = user_id. The new columns don't need separate
-- RLS policies since they sit on already-protected rows.

-- 1. Add client_id UUID for local-first sync mapping (all tables)
ALTER TABLE members ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE loan_settlements ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE investment_returns ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE;

-- 2. Add updated_at for conflict resolution (all tables)
ALTER TABLE members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE loan_settlements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE investments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE investment_returns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Indexes for sync queries (client_id lookups)
CREATE INDEX IF NOT EXISTS idx_members_client_id ON members(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_client_id ON accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loan_settlements_client_id ON loan_settlements(client_id);
CREATE INDEX IF NOT EXISTS idx_investments_client_id ON investments(client_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_client_id ON investment_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_groups_client_id ON groups(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_client_id ON recurring_transactions(client_id);

-- 4. Indexes for updated_at queries (sync-since-timestamp lookups)
CREATE INDEX IF NOT EXISTS idx_members_updated_at ON members(updated_at);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts(updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_loans_updated_at ON loans(updated_at);
CREATE INDEX IF NOT EXISTS idx_loan_settlements_updated_at ON loan_settlements(updated_at);
CREATE INDEX IF NOT EXISTS idx_investments_updated_at ON investments(updated_at);
CREATE INDEX IF NOT EXISTS idx_investment_returns_updated_at ON investment_returns(updated_at);
CREATE INDEX IF NOT EXISTS idx_groups_updated_at ON groups(updated_at);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON budgets(updated_at);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_updated_at ON recurring_transactions(updated_at);

-- 5. Auto-update updated_at trigger (applied to all data tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_loan_settlements_updated_at
  BEFORE UPDATE ON loan_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_investment_returns_updated_at
  BEFORE UPDATE ON investment_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Sync log table (server-side only)
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  last_sync_at TIMESTAMPTZ DEFAULT now(),
  direction TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  record_count INTEGER DEFAULT 0
);

-- RLS enabled with deny-all policy: blocks anon/authenticated keys,
-- service role (supabaseAdmin) bypasses RLS automatically.
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access to sync_log"
  ON sync_log FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(last_sync_at);
