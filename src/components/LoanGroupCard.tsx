import React, { useState, useMemo } from 'react';
import { Loan } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import LoanTable from './LoanTable';

export interface LoanGroup {
  key: string;
  loans: Loan[];
  groupName: string;
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
  const [expanded, setExpanded] = useState(false);

  const { loans, groupName, lenderName, totalRemaining, activeCount, latestDate } = group;
  const totalLent = loans.reduce((s, l) => s + l.amount, 0);
  const groupStatus = activeCount > 0 ? 'active' : 'settled';

  const uniqueBorrowers = useMemo(() => {
    const names = new Set<string>();
    for (const l of loans) {
      const name = l.borrower_name || l.borrower_account_name || (l.borrower_account_id ? `Account #${l.borrower_account_id}` : 'Unknown');
      if (name) names.add(name);
    }
    return Array.from(names);
  }, [loans]);

  const toggleExpand = () => setExpanded(v => !v);

  return (
    <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden">
      <div className="cursor-pointer" onClick={toggleExpand}>
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm md:text-base font-semibold text-ink truncate">{groupName}</h4>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider shrink-0",
                  groupStatus === 'active'
                    ? "bg-semantic-up/10 text-semantic-up"
                    : "bg-muted/10 text-muted"
                )}>
                  {groupStatus === 'active' ? `Active (${activeCount}/${loans.length})` : 'All Settled'}
                </span>
              </div>
              {groupingMode === 'pair' && uniqueBorrowers.length > 0 && (
                <p className="text-xs text-muted mt-0.5">
                  To: {uniqueBorrowers.slice(0, 3).join(', ')}{uniqueBorrowers.length > 3 ? ` +${uniqueBorrowers.length - 3} more` : ''}
                </p>
              )}
              {groupingMode === 'borrower' && lenderName && (
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
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
            className="px-3 py-1.5 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors flex items-center gap-1">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {expanded ? 'Hide Loans' : `${loans.length} Loan${loans.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity' }}
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
              groupingMode={groupingMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
