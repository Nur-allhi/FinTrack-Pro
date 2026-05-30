-- Migration: Enable RLS on all data tables
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This provides defense-in-depth: even if the anon key is compromised,
-- users can only access their own data.

-- 1. Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_settlements ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for members
CREATE POLICY "Users can view their own members"
  ON members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own members"
  ON members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
  ON members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
  ON members FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create RLS policies for investments
CREATE POLICY "Users can view their own investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create RLS policies for investment_returns
CREATE POLICY "Users can view their own investment returns"
  ON investment_returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment returns"
  ON investment_returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment returns"
  ON investment_returns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment returns"
  ON investment_returns FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS policies for loan_settlements
CREATE POLICY "Users can view their own loan settlements"
  ON loan_settlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loan settlements"
  ON loan_settlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan settlements"
  ON loan_settlements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loan settlements"
  ON loan_settlements FOR DELETE
  USING (auth.uid() = user_id);

-- Note: loans table already has RLS enabled via 003_add_loans_rls.sql
-- If you haven't run that migration yet, uncomment:
-- ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
