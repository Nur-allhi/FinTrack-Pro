-- Migration: Atomic import via PostgreSQL function
-- Run this in your Supabase SQL Editor
-- Wraps the DELETE + INSERT sequence in a DB transaction
-- so a failure mid-import doesn't leave the database empty.

CREATE OR REPLACE FUNCTION fintrack_import_data(
  p_user_id UUID,
  p_members JSONB DEFAULT '[]',
  p_accounts JSONB DEFAULT '[]',
  p_transactions JSONB DEFAULT '[]',
  p_investments JSONB DEFAULT '[]',
  p_investment_returns JSONB DEFAULT '[]'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Delete existing data for this user
  DELETE FROM investment_returns USING investments
    WHERE investments.id = investment_returns.investment_id
    AND investments.user_id = p_user_id;
  DELETE FROM investments WHERE user_id = p_user_id;
  DELETE FROM transactions WHERE user_id = p_user_id;
  DELETE FROM accounts WHERE user_id = p_user_id;
  DELETE FROM members WHERE user_id = p_user_id;

  -- Insert new data
  IF jsonb_array_length(p_members) > 0 THEN
    INSERT INTO members (id, name, relationship, user_id)
    SELECT * FROM jsonb_to_recordset(p_members) AS x(id BIGINT, name TEXT, relationship TEXT, user_id UUID);
  END IF;

  IF jsonb_array_length(p_accounts) > 0 THEN
    INSERT INTO accounts (id, name, type, member_id, parent_id, color, archived, initial_balance, user_id)
    SELECT * FROM jsonb_to_recordset(p_accounts) AS x(id BIGINT, name TEXT, type TEXT, member_id BIGINT, parent_id BIGINT, color TEXT, archived INT, initial_balance REAL, user_id UUID);
  END IF;

  IF jsonb_array_length(p_transactions) > 0 THEN
    INSERT INTO transactions (id, account_id, date, particulars, category, amount, type, linked_transaction_id, summary, user_id)
    SELECT * FROM jsonb_to_recordset(p_transactions) AS x(id BIGINT, account_id BIGINT, date TEXT, particulars TEXT, category TEXT, amount REAL, type TEXT, linked_transaction_id BIGINT, summary TEXT, user_id UUID);
  END IF;

  IF jsonb_array_length(p_investments) > 0 THEN
    INSERT INTO investments (id, account_id, principal, date, user_id)
    SELECT * FROM jsonb_to_recordset(p_investments) AS x(id BIGINT, account_id BIGINT, principal REAL, date TEXT, user_id UUID);
  END IF;

  IF jsonb_array_length(p_investment_returns) > 0 THEN
    INSERT INTO investment_returns (id, investment_id, date, amount, percentage)
    SELECT * FROM jsonb_to_recordset(p_investment_returns) AS x(id BIGINT, investment_id BIGINT, date TEXT, amount REAL, percentage REAL);
  END IF;

  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;
