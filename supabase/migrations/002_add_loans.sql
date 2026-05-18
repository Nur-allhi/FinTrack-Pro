-- Migration: Add loans table for inter-account loan tracking
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS loans (
  id BIGSERIAL PRIMARY KEY,
  lender_account_id BIGINT NOT NULL,
  borrower_account_id BIGINT NOT NULL,
  amount REAL NOT NULL,
  date_given DATE NOT NULL,
  due_date DATE,
  interest_rate REAL,
  particulars TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'defaulted')),
  settled_date DATE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
