import React from 'react';
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
      <div className="flex items-center gap-1 p-0.5 bg-surface-soft rounded-pill">
        {(['all', 'active', 'settled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              statusFilter === s ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Settled'}
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-hairline mx-1" />
      <div className="flex items-center gap-1 p-0.5 bg-surface-soft rounded-pill">
        <button onClick={() => setGroupingMode('pair')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold transition-all",
            groupingMode === 'pair' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink"
          )}>
          <ArrowLeftRight className="w-3 h-3" />
          By Pair
        </button>
        <button onClick={() => setGroupingMode('borrower')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold transition-all",
            groupingMode === 'borrower' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink"
          )}>
          <Users className="w-3 h-3" />
          By Borrower
        </button>
      </div>
    </div>
  );
}
