import React, { useState } from 'react';
import { Loan, Account } from '../types';
import { ChevronDown, ChevronRight, Handshake, CheckCircle2, ArrowRight, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { authService } from '../services/authService';
import { useToast } from './Toast';

export interface LoanGroup {
  key: string;
  loans: Loan[];
  borrowerName: string;
  lenderName?: string;
  totalAmount: number;
  totalRemaining: number;
  activeCount: number;
  latestDate: string;
}

interface LoanGroupCardProps {
  group: LoanGroup;
  currency: string;
  settlingId: number | null;
  deletingId: number | null;
  onSettleOpen: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  groupingMode: 'pair' | 'borrower';
}

export default function LoanGroupCard({
  group, currency, settlingId, deletingId,
  onSettleOpen, onEdit, onDelete, onRefresh, groupingMode
}: LoanGroupCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showGroupSettle, setShowGroupSettle] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleError, setSettleError] = useState('');
  const [settling, setSettling] = useState(false);

  const { loans, borrowerName, lenderName, totalAmount, totalRemaining, activeCount, latestDate } = group;
  const settledCount = loans.length - activeCount;
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalLent = loans.reduce((s, l) => s + l.amount, 0);

  const borrowerDisplay = borrowerName;

  const groupStatus = activeCount > 0 ? 'active' : 'settled';

  const handleGroupSettleOpen = () => {
    if (activeLoans.length === 0) {
      toast("No active loans to settle.", 'error');
      return;
    }
    setSelectedLoanId(activeLoans[0].id);
    setSettleAmount(String(activeLoans[0].remaining));
    setSettleError('');
    setShowGroupSettle(true);
  };

  const handleGroupSettleSubmit = async () => {
    if (!selectedLoanId) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      setSettleError("Enter a valid amount.");
      return;
    }
    const loan = activeLoans.find(l => l.id === selectedLoanId);
    if (!loan) return;
    if (amount > loan.remaining) {
      setSettleError(`Cannot exceed remaining (${currency}${loan.remaining.toLocaleString()}).`);
      return;
    }
    setSettling(true);
    try {
      const res = await authService.apiFetch(`/api/loans/${selectedLoanId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error("Failed to settle");
      const data = await res.json();
      if (data.settled) toast("Loan fully settled.", 'success');
      else toast(`Settlement recorded. Remaining: ${data.remaining}`, 'success');
      setShowGroupSettle(false);
      onRefresh();
    } catch {
      toast("Failed to settle loan.", 'error');
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm md:text-base font-semibold text-ink truncate">{borrowerDisplay}</h4>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider shrink-0",
                groupStatus === 'active'
                  ? "bg-semantic-up/10 text-semantic-up"
                  : "bg-muted/10 text-muted"
              )}>
                {groupStatus === 'active' ? `Active (${activeCount}/${loans.length})` : 'All Settled'}
              </span>
            </div>
            {groupingMode === 'pair' && lenderName && (
              <p className="text-xs text-muted mt-0.5">via {lenderName}</p>
            )}
            <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs text-muted flex-wrap">
              <span>Lent: <strong className="text-ink">{currency}{totalLent.toLocaleString()}</strong></span>
              <span>{loans.length} loan{loans.length > 1 ? 's' : ''}</span>
              <span>Latest: {format(new Date(latestDate), 'dd MMM yyyy')}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg md:text-xl font-bold text-ink financial-number">{currency}{totalRemaining.toLocaleString()}</div>
            <div className="text-[10px] text-muted font-medium uppercase tracking-wider">Outstanding</div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 md:px-5 pb-3">
        {activeCount > 0 && (
          <button onClick={handleGroupSettleOpen}
            className="px-3 py-1.5 rounded-pill text-xs font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settle Group
          </button>
        )}
        <button onClick={() => setExpanded(!expanded)}
          className="px-3 py-1.5 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors flex items-center gap-1 ml-auto">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expanded ? 'Hide Loans' : `${loans.length} Loan${loans.length > 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Expanded — mini table */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-hairline overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em]">
                    <th className="px-4 py-2.5 whitespace-nowrap">Date</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-right">Amount</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-right">Remaining</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Due</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Description</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-surface-soft/30 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-ink">{format(new Date(loan.date_given), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs font-bold text-ink financial-number">
                        {currency}{loan.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs font-semibold financial-number"
                        style={{ color: loan.remaining > 0 ? 'var(--color-semantic-up)' : 'var(--color-muted)' }}>
                        {currency}{loan.remaining.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted">{loan.due_date ? format(new Date(loan.due_date), 'dd MMM yyyy') : '-'}</td>
                      <td className="px-4 py-2.5 max-w-[160px] truncate text-xs text-muted">{loan.particulars || '-'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
                          loan.status === 'active' ? "bg-semantic-up/10 text-semantic-up" : "bg-muted/10 text-muted"
                        )}>
                          {loan.status === 'settled' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {loan.status === 'active' && (
                            <button onClick={() => onSettleOpen(loan)} disabled={settlingId === loan.id}
                              className="px-2 py-1 rounded-pill text-[10px] font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                              {settlingId === loan.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Settle'}
                            </button>
                          )}
                          <button onClick={() => onEdit(loan)}
                            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDelete(loan.id)} disabled={deletingId === loan.id}
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted text-xs">Amount:</span>
                    <span className="font-bold text-ink financial-number">{currency}{loan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted text-xs">Remaining:</span>
                    <span className="font-semibold financial-number"
                      style={{ color: loan.remaining > 0 ? 'var(--color-semantic-up)' : 'var(--color-muted)' }}>
                      {currency}{loan.remaining.toLocaleString()}
                    </span>
                  </div>
                  {loan.due_date && (
                    <div className="text-xs text-muted">Due: {format(new Date(loan.due_date), 'dd MMM yyyy')}</div>
                  )}
                  {loan.particulars && <p className="text-xs text-muted">{loan.particulars}</p>}
                  <div className="flex gap-2 pt-1">
                    {loan.status === 'active' && (
                      <button onClick={() => onSettleOpen(loan)} disabled={settlingId === loan.id}
                        className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                        {settlingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Settle'}
                      </button>
                    )}
                    <button onClick={() => onEdit(loan)}
                      className="py-2 px-3 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(loan.id)} disabled={deletingId === loan.id}
                      className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 transition-colors disabled:opacity-50">
                      {deletingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group settle modal */}
      {showGroupSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-canvas rounded-xl border border-hairline shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-base font-normal text-ink">Settle a Loan — {borrowerDisplay}</h4>
            <p className="text-xs text-muted">Total outstanding: <strong className="text-ink">{currency}{totalRemaining.toLocaleString()}</strong></p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Select which loan to settle</label>
              {activeLoans.map(loan => (
                <button key={loan.id} type="button" onClick={() => { setSelectedLoanId(loan.id); setSettleAmount(String(loan.remaining)); setSettleError(''); }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedLoanId === loan.id
                      ? "border-primary bg-primary/5"
                      : "border-hairline hover:bg-surface-soft"
                  )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-ink">{format(new Date(loan.date_given), 'dd MMM yyyy')}</span>
                      <span className="text-xs text-muted ml-2">{currency}{loan.amount.toLocaleString()}</span>
                      {loan.particulars && <div className="text-[10px] text-muted mt-0.5 truncate max-w-[180px]">{loan.particulars}</div>}
                    </div>
                    <span className="text-xs font-bold text-semantic-up financial-number">Rem: {currency}{loan.remaining.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Settle Amount</label>
              <input type="text" inputMode="decimal" value={settleAmount}
                onChange={e => { setSettleAmount(e.target.value); setSettleError(''); }}
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
              {settleError && <p className="text-xs text-semantic-down font-medium">{settleError}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowGroupSettle(false)}
                className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
              <button onClick={handleGroupSettleSubmit} disabled={settling || !selectedLoanId}
                className="btn-primary px-6 py-2.5 text-sm">
                {settling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Settle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
