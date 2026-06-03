export interface Member {
  id: number;
  name: string;
  relationship: string;
}

export interface Account {
  id: number;
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
}

export interface Transaction {
  id: number;
  account_id: number;
  date: string;
  particulars: string;
  category: string;
  amount: number;
  type: 'normal' | 'transfer';
  linked_transaction_id: number | null;
  summary: string | null;
}

export interface Investment {
  id: number;
  account_id: number;
  account_name?: string;
  principal: number;
  date: string;
}

export interface InvestmentReturn {
  id: number;
  investment_id: number;
  date: string;
  amount: number;
  percentage: number;
}

export interface OfflineActionBody {
  account_id?: number;
  amount?: number;
  date?: string;
  particulars?: string;
  category?: string;
  summary?: string | null;
  [key: string]: unknown;
}

export interface Loan {
  id: number;
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
