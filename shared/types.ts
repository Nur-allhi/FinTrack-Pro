export interface Member {
  id: number;
  name: string;
  relationship?: string | null;
  client_id?: string | null;
  updated_at?: string;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  member_id?: number | null;
  parent_id?: number | null;
  color?: string;
  archived?: number;
  initial_balance?: number;
  user_id?: string;
  member_name?: string;
  parent_name?: string;
  current_balance?: number;
  client_id?: string | null;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  date: string;
  particulars: string;
  category?: string | null;
  amount: number;
  type?: string;
  linked_transaction_id?: number | null;
  summary?: string | null;
  user_id?: string;
  linked_account_name?: string;
  client_id?: string | null;
  updated_at?: string;
}

export interface Loan {
  id: number;
  lender_account_id: number;
  borrower_account_id?: number | null;
  borrower_name?: string | null;
  amount: number;
  date_given: string;
  due_date?: string | null;
  interest_rate?: number | null;
  particulars?: string;
  status: string;
  settled_date?: string | null;
  remaining: number;
  user_id?: string;
  lender_name?: string;
  client_id?: string | null;
  updated_at?: string;
}

export interface Investment {
  id: number;
  account_id: number;
  principal: number;
  date: string;
  user_id?: string;
  account_name?: string;
  client_id?: string | null;
  updated_at?: string;
}

export interface InvestmentReturn {
  id: number;
  investment_id: number;
  date: string;
  amount: number;
  percentage?: number | null;
}

export interface LoanSettlement {
  id: number;
  loan_id: number;
  amount: number;
  date: string;
  notes?: string;
  user_id?: string;
  transaction_id?: number | null;
}

export interface Group {
  id: number;
  name: string;
  type: string;
  member_id?: number | null;
  color?: string;
  member_name?: string;
  child_count?: number;
  accumulated_balance?: number;
  children?: Account[];
  client_id?: string | null;
  updated_at?: string;
}
