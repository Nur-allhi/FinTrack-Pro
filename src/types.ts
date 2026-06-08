/**
 * src/types.ts — App-Specific TypeScript Types
 *
 * These types match what the React app and components use.
 * They support both local (UUID string) and server (number) FK fields
 * since the app must work offline with local data.
 */

// ─── Member ────────────────────────────────

export interface Member {
  id: number;
  name: string;
  relationship: string;
}

// ─── Account ───────────────────────────────

export interface Account {
  id: number;
  _localId?: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group';
  member_id: number | string | null;
  member_name?: string;
  parent_id: number | string | null;
  parent_name?: string;
  color: string;
  archived: number;
  initial_balance: number;
  current_balance: number;
  currency?: string;
}

// ─── Transaction ───────────────────────────

export interface Transaction {
  id: number;
  account_id: number;
  date: string;
  particulars: string;
  category: string;
  amount: number;
  type: 'normal' | 'transfer';
  linked_transaction_id: number | string | null;
  linked_account_name?: string | null;
  summary: string | null;
  updated_at?: string;
  created_at?: string;
  sync_status?: 'pending' | 'synced' | 'conflict';
}

// ─── Loan ──────────────────────────────────

export interface Loan {
  id: number;
  _localId?: string;
  lender_account_id: number;
  borrower_account_id: number | null;
  lender_name?: string;
  borrower_name?: string | null;
  borrower_account_name?: string;
  amount: number;
  remaining: number;
  date_given: string;
  due_date: string | null;
  interest_rate: number | null;
  particulars: string;
  status: 'active' | 'settled' | 'defaulted';
  settled_date: string | null;
}

// ─── Investment ────────────────────────────

export interface Investment {
  id: number;
  account_id: number;
  account_name?: string;
  principal: number;
  date: string;
}

// ─── InvestmentReturn ──────────────────────

export interface InvestmentReturn {
  id: number;
  investment_id: number;
  date: string;
  amount: number;
  percentage: number;
}

// ─── LoanSettlement ────────────────────────

export interface LoanSettlement {
  id: number;
  loan_id: number;
  amount: number;
  date: string;
  notes: string;
  transaction_id: number | null;
}

// ─── Budget ────────────────────────────────

export interface Budget {
  id: number;
  category: string;
  amount: number;
  month: string;
}

// ─── RecurringTransaction ──────────────────

export interface RecurringTransaction {
  id: number;
  account_id: number;
  particulars: string;
  category: string;
  amount: number;
  frequency: string;
  next_date: string;
  active: boolean;
}

// ─── Group ─────────────────────────────────

export interface Group {
  id: number;
  name: string;
  type: string;
  member_id: number | string | null;
  color: string;
  member_name?: string;
  child_count?: number;
  accumulated_balance?: number;
  children?: Account[];
}

// ─── Offline Action Body ───────────────────

export interface OfflineActionBody {
  account_id?: number;
  amount?: number;
  date?: string;
  particulars?: string;
  category?: string;
  summary?: string | null;
  [key: string]: unknown;
}

// ─── Write Operation Types ─────────────────

export type WriteOperation =
  | { type: 'transaction'; prefillAccountId?: number; editTx?: Transaction }
  | { type: 'transfer' }
  | { type: 'loan_create' }
  | { type: 'loan_edit'; loan: Loan }
  | { type: 'loan_settle'; loan: Loan }
  | { type: 'investment_create' }
  | { type: 'investment_return'; investment: Investment };

// ─── Union Types ───────────────────────────

export const ACCOUNT_TYPES = [
  'cash', 'bank', 'mobile', 'investment', 'purpose', 'home_exp', 'group'
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number];

export const LOAN_STATUSES = ['active', 'settled', 'defaulted'] as const;
export type LoanStatus = typeof LOAN_STATUSES[number];

export const TRANSACTION_TYPES = ['normal', 'transfer'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
