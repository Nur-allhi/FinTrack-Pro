import React from 'react';
import { Loan } from '../types';
import { CheckCircle2, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface LoanTableProps {
  loans: Loan[];
  currency: string;
  settlingId: number | null;
  deletingId: number | null;
  onSettleOpen: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (id: number) => void;
  groupingMode: 'pair' | 'borrower';
}

function counterpartyName(loan: Loan, mode: 'pair' | 'borrower'): string {
  if (mode === 'pair') {
    return loan.borrower_name || loan.borrower_account_name || (loan.borrower_account_id ? `Account #${loan.borrower_account_id}` : 'Unknown');
  }
  return loan.lender_name || `Account #${loan.lender_account_id}`;
}

function counterpartyLabel(mode: 'pair' | 'borrower'): string {
  return mode === 'pair' ? 'Borrower' : 'Lender';
}

export default function LoanTable({ loans, currency, settlingId, deletingId, onSettleOpen, onEdit, onDelete, groupingMode }: LoanTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em]">
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Date</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Description</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">{counterpartyLabel(groupingMode)}</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Amount</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Paid</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Remaining</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Status</th>
              <th className="px-4 py-2.5 whitespace-nowrap text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {loans.map(loan => (
              <tr key={loan.id} className="hover:bg-surface-soft/30 transition-colors">
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-ink text-center">{format(new Date(loan.date_given), 'dd MMM yyyy')}</td>
                <td className="px-4 py-2.5 max-w-[160px] truncate text-xs text-muted text-left">{loan.particulars || '-'}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-ink text-center">{counterpartyName(loan, groupingMode)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-bold text-ink financial-number text-center">
                  {currency}{loan.amount.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold financial-number text-center text-muted">
                  {currency}{(loan.amount - loan.remaining).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold financial-number text-center"
                  style={{ color: loan.remaining > 0 ? 'var(--color-semantic-up)' : 'var(--color-muted)' }}>
                  {currency}{loan.remaining.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
                    loan.status === 'active' ? "bg-semantic-up/10 text-semantic-up" : "bg-muted/10 text-muted"
                  )}>
                    {loan.status === 'settled' && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {loan.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    {loan.status === 'active' && (
                      <button onClick={(e) => { e.stopPropagation(); onSettleOpen(loan); }} disabled={settlingId === loan.id}
                        className="px-2 py-1 rounded-pill text-[10px] font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                        {settlingId === loan.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Settle'}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(loan); }}
                      className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(loan.id); }} disabled={deletingId === loan.id}
                      className="px-2 py-1 rounded-pill text-[10px] font-bold bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 transition-colors disabled:opacity-50">
                      {deletingId === loan.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile loan list */}
      <div className="md:hidden divide-y divide-hairline">
        {loans.map(loan => (
          <div key={loan.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink">{format(new Date(loan.date_given), 'dd MMM yyyy')}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
                loan.status === 'active' ? "bg-semantic-up/10 text-semantic-up" : "bg-muted/10 text-muted"
              )}>{loan.status}</span>
            </div>
            {loan.particulars && <p className="text-xs text-muted">{loan.particulars}</p>}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted text-xs">{counterpartyLabel(groupingMode)}:</span>
              <span className="font-medium text-ink text-xs">{counterpartyName(loan, groupingMode)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted text-xs">Amount:</span>
              <span className="font-bold text-ink financial-number">{currency}{loan.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted text-xs">Paid:</span>
              <span className="font-semibold financial-number text-muted">{currency}{(loan.amount - loan.remaining).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted text-xs">Remaining:</span>
              <span className="font-semibold financial-number"
                style={{ color: loan.remaining > 0 ? 'var(--color-semantic-up)' : 'var(--color-muted)' }}>
                {currency}{loan.remaining.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              {loan.status === 'active' && (
                <button onClick={(e) => { e.stopPropagation(); onSettleOpen(loan); }} disabled={settlingId === loan.id}
                  className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                  {settlingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Settle'}
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onEdit(loan); }}
                className="py-2 px-3 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(loan.id); }} disabled={deletingId === loan.id}
                className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 transition-colors disabled:opacity-50">
                {deletingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
