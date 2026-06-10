import React from 'react';
import { motion } from 'motion/react';
import { Loan } from '../types';
import { Users, ArrowLeftRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoanFiltersProps {
  statusFilter: 'all' | 'active' | 'settled';
  setStatusFilter: (v: 'all' | 'active' | 'settled') => void;
  groupingMode: 'pair' | 'borrower';
  setGroupingMode: (v: 'pair' | 'borrower') => void;
}

export default function LoanFilters({ statusFilter, setStatusFilter, groupingMode, setGroupingMode }: LoanFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 p-0.5 bg-surface-soft rounded-pill relative shadow-sm">
        {(['all', 'active', 'settled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn(
              "relative px-3 py-1.5 rounded-pill text-xs font-bold uppercase tracking-wider transition-colors flex-1 text-center whitespace-nowrap",
              statusFilter === s ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            <span className="relative z-10">{s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Settled'}</span>
            {statusFilter === s && (
              <motion.div layoutId="loan-status-slider" className="absolute inset-0 rounded-pill bg-canvas shadow-sm pointer-events-none" />
            )}
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-hairline mx-1" />
      <div className="flex items-center gap-1 p-0.5 bg-surface-soft rounded-pill relative shadow-sm">
        {(['pair', 'borrower'] as const).map(g => (
          <button key={g} onClick={() => setGroupingMode(g)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-pill text-xs font-bold transition-colors flex-1 whitespace-nowrap",
              groupingMode === g ? "text-ink" : "text-muted hover:text-ink"
            )}>
            <span className="relative z-10">{g === 'pair' ? <ArrowLeftRight className="w-3 h-3" /> : <Users className="w-3 h-3" />}</span>
            <span className="relative z-10">{g === 'pair' ? 'By Pair' : 'By Borrower'}</span>
            {groupingMode === g && (
              <motion.div layoutId="loan-grouping-slider" className="absolute inset-0 rounded-pill bg-canvas shadow-sm pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
