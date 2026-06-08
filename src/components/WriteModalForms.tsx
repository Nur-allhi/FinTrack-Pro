import React, { useState } from 'react';
import { Account, Transaction, Loan, Investment } from '../types';
import Select from './Select';
import DatePicker from './DatePicker';
import DebitCreditToggle from './DebitCreditToggle';

export interface TransactionFormState {
  account_id: string;
  date: string;
  particulars: string;
  amount: string;
  isCredit: boolean;
  category: string;
}

export interface TransferFormState {
  from_account_id: string;
  to_account_id: string;
  amount: string;
  particulars: string;
  date: string;
}

export interface LoanFormState {
  loanType: 'person' | 'inter_account';
  lender_account_id: string;
  borrower_account_id: string;
  borrower_name: string;
  amount: string;
  date_given: string;
  due_date: string;
  interest_rate: string;
  particulars: string;
}

export interface LoanSettleFormState {
  loanId: string;
  amount: string;
  date: string;
}

export interface InvestmentFormState {
  account_id: string;
  principal: string;
  date: string;
}

export interface InvestmentReturnFormState {
  investment_id: string;
  date: string;
  amount: string;
  percentage: string;
}

// ─── Transaction Form ────────────────────────────────────────────────────────

interface TransactionFormProps {
  state: TransactionFormState;
  onChange: (s: TransactionFormState) => void;
  accounts: Account[];
  categories: string[];
  currency: string;
}

export function TransactionForm({ state, onChange, accounts, categories, currency }: TransactionFormProps) {
  const catInList = categories.includes(state.category);
  const [isCustom, setIsCustom] = useState(!catInList && state.category !== '');

  const handleCategorySelect = (value: string) => {
    if (value === '__new__') {
      setIsCustom(true);
      onChange({ ...state, category: '' });
    } else {
      setIsCustom(false);
      onChange({ ...state, category: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Account</label>
        <Select
          value={state.account_id}
          onChange={v => onChange({ ...state, account_id: v })}
          placeholder="Select Account"
          options={accounts.filter(a => !a.archived).map(a => ({
            value: String(a.id),
            label: a.member_name
              ? `${a.name} · ${a.member_name} (${currency}${(a.current_balance || 0).toLocaleString()})`
              : `${a.name} (${currency}${(a.current_balance || 0).toLocaleString()})`
          }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
          <DatePicker value={state.date} onChange={v => onChange({ ...state, date: v })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Type</label>
          <DebitCreditToggle isCredit={state.isCredit} onChange={v => onChange({ ...state, isCredit: v })} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Amount ({currency})</label>
        <input type="text" inputMode="decimal" required value={state.amount}
          onChange={e => onChange({ ...state, amount: e.target.value })}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Category</label>
        <div className="flex flex-col gap-2">
          <Select
            value={isCustom ? '__new__' : (catInList ? state.category : '')}
            onChange={handleCategorySelect}
            placeholder={state.category && !catInList ? state.category : 'Select category'}
            options={[
              ...categories.map(c => ({ value: c, label: c })),
              { value: '__new__', label: 'New category...' }
            ]}
          />
          {isCustom && (
            <input type="text" placeholder="Type new category name"
              value={state.category}
              onChange={e => onChange({ ...state, category: e.target.value })}
              className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium" />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Particulars</label>
        <input type="text" required value={state.particulars}
          onChange={e => onChange({ ...state, particulars: e.target.value })}
          placeholder="Transaction description"
          className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium" />
      </div>
    </div>
  );
}

// ─── Transfer Form ──────────────────────────────────────────────────────────

interface TransferFormProps {
  state: TransferFormState;
  onChange: (s: TransferFormState) => void;
  accounts: Account[];
  currency: string;
}

export function TransferForm({ state, onChange, accounts, currency }: TransferFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Source Account</label>
        <Select
          value={state.from_account_id}
          onChange={v => onChange({ ...state, from_account_id: v })}
          placeholder="Select Source"
          options={accounts.filter(a => !a.archived).map(a => ({
            value: String(a.id),
            label: a.member_name
              ? `${a.name} · ${a.member_name} (${currency}${(a.current_balance || 0).toLocaleString()})`
              : `${a.name} (${currency}${(a.current_balance || 0).toLocaleString()})`
          }))}
        />
      </div>
      <div className="flex justify-center -my-3 relative z-10">
        <div className="bg-canvas p-2 rounded-full border border-hairline shadow-sm">
          <svg className="w-4 h-4 text-primary rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Destination Account</label>
        <Select
          value={state.to_account_id}
          onChange={v => onChange({ ...state, to_account_id: v })}
          placeholder="Select Destination"
          options={accounts.filter(a => !a.archived).map(a => ({
            value: String(a.id),
            label: a.member_name
              ? `${a.name} · ${a.member_name} (${currency}${(a.current_balance || 0).toLocaleString()})`
              : `${a.name} (${currency}${(a.current_balance || 0).toLocaleString()})`
          }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Amount ({currency})</label>
          <input type="text" inputMode="decimal" required value={state.amount}
            onChange={e => onChange({ ...state, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
          <DatePicker value={state.date} onChange={v => onChange({ ...state, date: v })} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Particulars</label>
        <input type="text" required value={state.particulars}
          onChange={e => onChange({ ...state, particulars: e.target.value })}
          placeholder="Transfer description"
          className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium" />
      </div>
    </div>
  );
}

// ─── Loan Create Form ──────────────────────────────────────────────────────

interface LoanCreateFormProps {
  state: LoanFormState;
  onChange: (s: LoanFormState) => void;
  accounts: Account[];
  editMode?: boolean;
  currency?: string;
}

export function LoanCreateForm({ state, onChange, accounts, editMode, currency }: LoanCreateFormProps) {
  const activeAccounts = accounts.filter(a => !a.archived);
  const accountOptions = activeAccounts.map(a => ({
    value: String(a.id),
    label: a.member_name
      ? `${a.name} · ${a.member_name} (${currency}${(a.current_balance || 0).toLocaleString()})`
      : `${a.name} (${currency}${(a.current_balance || 0).toLocaleString()})`
  }));

  const set = (field: Partial<LoanFormState>) => onChange({ ...state, ...field });

  return (
    <div className="space-y-6">
      {!editMode && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => set({ loanType: 'person', borrower_account_id: '' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all ${
              state.loanType === 'person' ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted hover:bg-surface-strong'
            }`}>
            Person Loan
          </button>
          <button type="button" onClick={() => set({ loanType: 'inter_account', borrower_name: '' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all ${
              state.loanType === 'inter_account' ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted hover:bg-surface-strong'
            }`}>
            Inter-Account
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
            {state.loanType === 'person' ? 'From Account' : 'Lender Account'}
          </label>
          {editMode ? (
            <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">
              {accountOptions.find(o => o.value === state.lender_account_id)?.label || `Account #${state.lender_account_id}`}
            </div>
          ) : (
            <Select value={state.lender_account_id} onChange={v => set({ lender_account_id: v })}
              placeholder="Select Account" options={accountOptions} />
          )}
        </div>

        {state.loanType === 'person' ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Name</label>
            <input type="text" required={!editMode} value={state.borrower_name}
              onChange={e => set({ borrower_name: e.target.value })}
              placeholder="Enter person name"
              className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Account</label>
            {editMode ? (
              <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">
                {accountOptions.find(o => o.value === state.borrower_account_id)?.label || `Account #${state.borrower_account_id}`}
              </div>
            ) : (
              <Select value={state.borrower_account_id} onChange={v => set({ borrower_account_id: v })}
                placeholder="Select Borrower" options={accountOptions} />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount</label>
          {editMode ? (
            <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm financial-number">{state.amount}</div>
          ) : (
            <input type="text" inputMode="decimal" required value={state.amount}
              onChange={e => set({ amount: e.target.value })} placeholder="0.00"
              className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Date Given</label>
          <DatePicker value={state.date_given} onChange={v => set({ date_given: v })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Due Date</label>
          <DatePicker value={state.due_date} onChange={v => set({ due_date: v })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Interest Rate (%)</label>
          <input type="number" step="0.01" value={state.interest_rate}
            onChange={e => set({ interest_rate: e.target.value })} placeholder="Optional"
            className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Particulars</label>
          <input type="text" value={state.particulars}
            onChange={e => set({ particulars: e.target.value })} placeholder="Loan description"
            className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── Loan Settle Form ──────────────────────────────────────────────────────

interface LoanSettleFormProps {
  state: LoanSettleFormState;
  onChange: (s: LoanSettleFormState) => void;
  loans: { id: number; label: string; remaining: number; currency: string }[];
  currency: string;
  loan?: Loan;
  settlements?: { date: string; amount: number; notes: string }[];
  issueDate?: string;
}

export function LoanSettleForm({ state, onChange, loans, currency, loan, settlements, issueDate }: LoanSettleFormProps) {
  const selectedLoan = state.loanId
    ? loans.find(l => l.id === Number(state.loanId))
    : (loan ? { id: loan.id, label: loan.borrower_name || `Loan #${loan.id}`, remaining: loan.remaining, currency } : null);

  return (
    <div className="space-y-6">
      {!loan && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Select Loan</label>
          <Select
            value={state.loanId}
            onChange={v => {
              const l = loans.find(x => x.id === Number(v));
              onChange({ ...state, loanId: v, amount: l ? String(l.remaining) : '' });
            }}
            placeholder="Select a loan to settle"
            options={loans.map(l => ({ value: String(l.id), label: `${l.label} — ${currency}${l.remaining.toLocaleString()}` }))}
          />
        </div>
      )}

      {selectedLoan && (
        <div className="bg-surface-soft rounded-xl p-4 space-y-2 border border-hairline">
          <p className="text-xs text-muted font-medium">{selectedLoan.label}</p>
          <p className="text-lg font-bold text-ink financial-number">{currency}{selectedLoan.remaining.toLocaleString()}</p>
          {issueDate && (
            <p className="text-[10px] text-muted flex items-center gap-1">
              <span>Issued</span>
              <span className="font-medium">{new Date(issueDate).toLocaleDateString()}</span>
            </p>
          )}
        </div>
      )}

      {settlements && settlements.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
            Repayments ({settlements.length})
          </label>
          <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-surface-soft text-sm">
                <span className="text-muted text-xs">{new Date(s.date).toLocaleDateString()}</span>
                <span className="font-medium financial-number text-semantic-up">+{currency}{s.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements && settlements.length === 0 && (
        <p className="text-xs text-muted text-center">No repayments yet.</p>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Settle Amount ({currency})</label>
        <input type="text" inputMode="decimal" required value={state.amount}
          onChange={e => onChange({ ...state, amount: e.target.value })}
          className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
      </div>
    </div>
  );
}

// ─── Investment Create Form ────────────────────────────────────────────────

interface InvestmentFormProps {
  state: InvestmentFormState;
  onChange: (s: InvestmentFormState) => void;
  accounts: Account[];
  currency?: string;
}

export function InvestmentCreateForm({ state, onChange, accounts, currency }: InvestmentFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Account</label>
        <Select
          value={state.account_id}
          onChange={v => onChange({ ...state, account_id: v })}
          placeholder="Select Investment Account"
          options={accounts.filter(a => a.type === 'investment').map(a => ({
            value: String(a.id),
            label: a.member_name
              ? `${a.name} · ${a.member_name} (${currency}${(a.current_balance || 0).toLocaleString()})`
              : `${a.name} (${currency}${(a.current_balance || 0).toLocaleString()})`
          }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Principal</label>
          <input type="number" required value={state.principal}
            onChange={e => onChange({ ...state, principal: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Date</label>
          <DatePicker value={state.date} onChange={v => onChange({ ...state, date: v })} />
        </div>
      </div>
    </div>
  );
}

// ─── Investment Return Form ────────────────────────────────────────────────

interface InvestmentReturnFormProps {
  state: InvestmentReturnFormState;
  onChange: (s: InvestmentReturnFormState) => void;
  investments: { id: number; label: string }[];
  investment?: Investment;
  currency: string;
}

export function InvestmentReturnForm({ state, onChange, investments, investment, currency }: InvestmentReturnFormProps) {
  return (
    <div className="space-y-6">
      {!investment && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Investment</label>
          <Select
            value={state.investment_id}
            onChange={v => onChange({ ...state, investment_id: v })}
            placeholder="Select Investment"
            options={investments.map(i => ({ value: String(i.id), label: i.label }))}
          />
        </div>
      )}

      {investment && (
        <div className="bg-surface-soft rounded-xl p-4 border border-hairline">
          <p className="text-xs text-muted font-medium">{investment.account_name}</p>
          <p className="text-lg font-bold text-ink financial-number">{currency}{investment.principal.toLocaleString()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Date</label>
          <DatePicker value={state.date} onChange={v => onChange({ ...state, date: v })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount ({currency})</label>
          <input type="number" required value={state.amount}
            onChange={e => onChange({ ...state, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Yield %</label>
          <input type="number" step="0.01" required value={state.percentage}
            onChange={e => onChange({ ...state, percentage: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
        </div>
      </div>
    </div>
  );
}
