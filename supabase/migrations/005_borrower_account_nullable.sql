-- Migration: Make borrower_account_id nullable for person loans
ALTER TABLE loans ALTER COLUMN borrower_account_id DROP NOT NULL;
