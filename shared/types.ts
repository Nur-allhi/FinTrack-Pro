/**
 * shared/types.ts — Shared TypeScript Types
 * 
 * Generated from shared/schema.ts. These are the server-facing types
 * used by both client and server. They match the PostgreSQL columns
 * exactly (no local-only fields, server_id uses BIGSERIAL number).
 */

// ─── Base Types ────────────────────────────

export interface BaseServerRecord {
  id: number;
  client_id?: string | null;
  user_id?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ─── Members ───────────────────────────────

export interface Member extends BaseServerRecord {
  name: string;
  relationship: string | null;
}

// ─── Accounts ──────────────────────────────

export interface Account extends BaseServerRecord {
  name: string;
  type: 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group';
  member_id: number | null;
  parent_id: number | null;
  color: string;
  archived: number;
  initial_balance: number;
  currency?: string;
  // Display fields from joins
  member_name?: string;
  parent_name?: string;
  current_balance?: number;
}

// ─── Transactions ──────────────────────────

export interface Transaction extends BaseServerRecord {
  account_id: number;
  date: string;
  particulars: string;
  category: string | null;
  amount: number;
  type: 'normal' | 'transfer';
  linked_transaction_id: number | null;
  summary: string | null;
  // Display fields
  linked_account_name?: string;
}

// ─── Loans ─────────────────────────────────

export interface Loan extends BaseServerRecord {
  lender_account_id: number;
  borrower_account_id: number | null;
  borrower_name: string | null;
  amount: number;
  remaining: number;
  date_given: string;
  due_date: string | null;
  interest_rate: number | null;
  particulars: string;
  status: 'active' | 'settled' | 'defaulted';
  settled_date: string | null;
  // Display fields
  lender_name?: string;
  borrower_account_name?: string;
}

// ─── Loan Settlements ──────────────────────

export interface LoanSettlement extends BaseServerRecord {
  loan_id: number;
  amount: number;
  date: string;
  notes: string;
  transaction_id: number | null;
}

// ─── Investments ───────────────────────────

export interface Investment extends BaseServerRecord {
  account_id: number;
  principal: number;
  date: string;
  // Display fields
  account_name?: string;
}

// ─── Investment Returns ────────────────────

export interface InvestmentReturn extends BaseServerRecord {
  investment_id: number;
  date: string;
  amount: number;
  percentage: number | null;
}

// ─── Budgets ───────────────────────────────

export interface Budget extends BaseServerRecord {
  category: string;
  amount: number;
  month: string; // YYYY-MM format
  created_at: string;
}

// ─── Recurring Transactions ────────────────

export interface RecurringTransaction extends BaseServerRecord {
  account_id: number;
  particulars: string;
  category: string | null;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  active: boolean;
  created_at: string;
}

// ─── Groups ────────────────────────────────

export interface Group extends BaseServerRecord {
  name: string;
  type: string;
  member_id: number | null;
  color: string;
  // Display/computed fields
  member_name?: string;
  child_count?: number;
  accumulated_balance?: number;
  children?: Array<{
    id: number;
    name: string;
    type: string;
    current_balance: number;
  }>;
}

// ─── Sync Log (server only) ─────────────────

export interface SyncLog {
  id: number;
  user_id: string;
  last_sync_at: string;
  direction: string;
  entity_type: string;
  record_count: number;
}

// ─── Union Types ───────────────────────────

export type SyncTable =
  | 'members'
  | 'accounts'
  | 'transactions'
  | 'loans'
  | 'loan_settlements'
  | 'investments'
  | 'investment_returns'
  | 'budgets'
  | 'recurring_transactions'
  | 'groups';

export type ServerEntity =
  | Member
  | Account
  | Transaction
  | Loan
  | LoanSettlement
  | Investment
  | InvestmentReturn
  | Budget
  | RecurringTransaction
  | Group;
