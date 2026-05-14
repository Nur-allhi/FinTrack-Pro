export interface Member {
  id: number;
  name: string;
  relationship: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group';
  member_id: number | null;
  member_name?: string;
  parent_id: number | null;
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
