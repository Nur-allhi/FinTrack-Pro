import React from 'react';
import { Plus, X, User, Building2, Loader2 } from 'lucide-react';
import { Account } from '../types';
import { cn } from '../utils/cn';
import DatePicker from './DatePicker';
import Select from './Select';

export interface LoanFormState {
  lender_account_id: string;
  borrower_account_id: string;
  borrower_name: string;
  amount: string;
  date_given: string;
  due_date: string;
  interest_rate: string;
  particulars: string;
}

interface LoanFormProps {
  editingId: number | null;
  loanType: 'inter_account' | 'person';
  form: LoanFormState;
  loading: boolean;
  accounts: Account[];
  onFormChange: (form: LoanFormState) => void;
  onLoanTypeChange: (type: 'inter_account' | 'person') => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function LoanForm({
  editingId, loanType, form, loading, accounts,
  onFormChange, onLoanTypeChange, onSubmit, onCancel
}: LoanFormProps) {
  const activeAccounts = accounts.filter(a => !a.archived);
  const accountOptions = activeAccounts.map(a => ({
    value: String(a.id),
    label: a.member_name ? `${a.name} · ${a.member_name}` : a.name
  }));

  const set = (field: Partial<LoanFormState>) => onFormChange({ ...form, ...field });

  return (
    <div className="card-xl border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h4 className="text-base md:text-lg font-normal text-ink">{editingId ? 'Edit Loan' : 'New Loan'}</h4>
        <button onClick={onCancel} className="p-1 md:p-2 text-muted hover:text-ink">
          <X className="w-5 md:w-6 h-5 md:h-6" />
        </button>
      </div>

      {!editingId && (
        <div className="flex items-center gap-2 mb-6">
          <button type="button" onClick={() => onLoanTypeChange('person')}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              loanType === 'person' ? "bg-primary text-white shadow-sm" : "bg-surface-soft text-muted hover:bg-surface-strong"
            )}>
            <User className="w-3.5 h-3.5" />
            Person Loan
          </button>
          <button type="button" onClick={() => onLoanTypeChange('inter_account')}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              loanType === 'inter_account' ? "bg-primary text-white shadow-sm" : "bg-surface-soft text-muted hover:bg-surface-strong"
            )}>
            <Building2 className="w-3.5 h-3.5" />
            Inter-Account
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
              {loanType === 'person' ? 'From Account' : 'Lender Account'}
            </label>
            {editingId ? (
              <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">
                {accountOptions.find(o => o.value === form.lender_account_id)?.label || `Account #${form.lender_account_id}`}
              </div>
            ) : (
              <Select
                value={form.lender_account_id}
                onChange={v => set({ lender_account_id: v })}
                placeholder={loanType === 'person' ? 'Select Account' : 'Select Lender'}
                options={accountOptions}
              />
            )}
          </div>

          {loanType === 'person' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Name</label>
              <input type="text" required={!editingId} value={form.borrower_name}
                onChange={e => set({ borrower_name: e.target.value })}
                placeholder={editingId ? "Person name" : "Enter person name"}
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Account</label>
              {editingId ? (
                <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">
                  {accountOptions.find(o => o.value === form.borrower_account_id)?.label || `Account #${form.borrower_account_id}`}
                </div>
              ) : (
                <Select
                  value={form.borrower_account_id}
                  onChange={v => set({ borrower_account_id: v })}
                  placeholder="Select Borrower"
                  options={accountOptions}
                />
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount</label>
            {editingId ? (
              <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm financial-number">{form.amount}</div>
            ) : (
              <input type="text" inputMode="decimal" required value={form.amount}
                onChange={e => set({ amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Date Given</label>
            {editingId ? (
              <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">{form.date_given}</div>
            ) : (
              <DatePicker value={form.date_given} onChange={v => set({ date_given: v })} />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Due Date</label>
            <DatePicker value={form.due_date} onChange={v => set({ due_date: v })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Interest Rate (%)</label>
            <input type="number" step="0.01" value={form.interest_rate}
              onChange={e => set({ interest_rate: e.target.value })}
              placeholder="Optional"
              className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Particulars</label>
            <input type="text" value={form.particulars}
              onChange={e => set({ particulars: e.target.value })}
              placeholder="Loan description"
              className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary px-8 py-3">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary px-10 py-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {editingId ? 'Update Loan' : 'Create Loan'}
          </button>
        </div>
      </form>
    </div>
  );
}
