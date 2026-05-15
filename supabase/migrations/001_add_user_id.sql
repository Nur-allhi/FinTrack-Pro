-- Migration: Add user_id column to all tables for multi-tenant data isolation
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add user_id column to members
ALTER TABLE members ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 2. Add user_id column to accounts
ALTER TABLE accounts ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 3. Add user_id column to transactions
ALTER TABLE transactions ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 4. Add user_id column to investments
ALTER TABLE investments ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 5. Add user_id column to investment_returns
ALTER TABLE investment_returns ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 6. Create indexes for faster user-scoped queries
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_user_id ON investment_returns(user_id);

-- 7. (Optional) Enable Row Level Security on all tables
-- Uncomment these if you want RLS as a defense-in-depth layer:
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE investment_returns ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can only see their own members" ON members FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own investments" ON investments FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own investment_returns" ON investment_returns FOR ALL USING (auth.uid() = user_id);

-- Note: After running this migration, existing rows will have the default UUID.
-- You should update them to the correct user_id if you have existing users.
-- Example: UPDATE members SET user_id = '<your-user-uuid>' WHERE user_id = '00000000-0000-0000-0000-000000000000';
