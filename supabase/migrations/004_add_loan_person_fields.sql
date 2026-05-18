-- Migration: Add person loan fields and settlement tracking
-- Run in Supabase SQL Editor

ALTER TABLE loans ADD COLUMN IF NOT EXISTS borrower_name TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS remaining REAL NOT NULL DEFAULT 0;

UPDATE loans SET remaining = amount WHERE remaining = 0;

CREATE TABLE IF NOT EXISTS loan_settlements (
  id BIGSERIAL PRIMARY KEY,
  loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  notes TEXT DEFAULT '',
  user_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loan_settlements_loan_id ON loan_settlements(loan_id);
