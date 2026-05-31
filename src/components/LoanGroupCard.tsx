import React, { useState } from 'react';
import { Loan } from '../types';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import LoanTable from './LoanTable';
import GroupSettleModal from './GroupSettleModal';

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

  const { loans, borrowerName, lenderName, totalRemaining, activeCount, latestDate } = group;
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalLent = loans.reduce((s, l) => s + l.amount, 0);
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
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm md:text-base font-semibold text-ink truncate">{borrowerName}</h4>
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

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-hairline overflow-hidden"
          >
            <LoanTable
              loans={loans}
              currency={currency}
              settlingId={settlingId}
              deletingId={deletingId}
              onSettleOpen={onSettleOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GroupSettleModal
        open={showGroupSettle}
        borrowerDisplay={borrowerName}
        totalRemaining={totalRemaining}
        currency={currency}
        activeLoans={activeLoans}
        selectedLoanId={selectedLoanId}
        setSelectedLoanId={setSelectedLoanId}
        settleAmount={settleAmount}
        setSettleAmount={setSettleAmount}
        settleError={settleError}
        setSettleError={setSettleError}
        onSettle={handleGroupSettleSubmit}
        onCancel={() => setShowGroupSettle(false)}
        settling={settling}
      />
    </div>
  );
}
