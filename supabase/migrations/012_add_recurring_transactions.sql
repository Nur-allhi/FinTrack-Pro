-- Recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  particulars TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring transactions"
  ON recurring_transactions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date) WHERE active = true;
