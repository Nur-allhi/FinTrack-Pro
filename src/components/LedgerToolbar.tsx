import React from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';
import Select from './Select';
import DatePicker from './DatePicker';

interface LedgerToolbarProps {
  dateView: 'all' | 'month' | 'date' | 'range';
  setDateView: (v: 'all' | 'month' | 'date' | 'range') => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  dateRangeStart: string;
  setDateRangeStart: (v: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (v: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (v: string | null) => void;
  availableCategories: string[];
  categoryCounts: Record<string, number>;
  dateFilteredCount: number;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  onAdd: () => void;
  className?: string;
}

export default function LedgerToolbar({
  dateView, setDateView,
  selectedMonth, setSelectedMonth,
  selectedDate, setSelectedDate,
  dateRangeStart, setDateRangeStart,
  dateRangeEnd, setDateRangeEnd,
  categoryFilter, setCategoryFilter,
  availableCategories, categoryCounts, dateFilteredCount,
  showFilters, setShowFilters,
  onAdd,
  className = '',
}: LedgerToolbarProps) {
  const modes = ['all', 'month', 'date', 'range'] as const;

  return (
    <div className={className}>
      {/* Mobile toggle */}
      {showFilters && (
        <div className="md:hidden px-4 py-3 space-y-3 border-b border-hairline bg-surface-soft/20">
          <div className="bg-canvas rounded-xl border border-hairline p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              {modes.map(mode => (
                <button
                  key={mode}
                  onClick={() => setDateView(mode)}
                  className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
                    dateView === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-surface-strong'
                  }`}
                >
                  {mode === 'all' && 'All'}
                  {mode === 'month' && 'Month'}
                  {mode === 'date' && 'Date'}
                  {mode === 'range' && 'Range'}
                </button>
              ))}
            </div>
            {dateView === 'month' && (
              <DatePicker mode="month" value={selectedMonth + '-01'} onChange={v => setSelectedMonth(v.slice(0, 7))} className="w-full" />
            )}
            {dateView === 'date' && (
              <DatePicker value={selectedDate} onChange={v => setSelectedDate(v)} className="w-full" />
            )}
            {dateView === 'range' && (
              <div className="flex items-center gap-2">
                <DatePicker value={dateRangeStart} onChange={v => setDateRangeStart(v)} className="flex-1" />
                <span className="text-xs text-muted font-bold">—</span>
                <DatePicker value={dateRangeEnd} onChange={v => setDateRangeEnd(v)} className="flex-1" />
              </div>
            )}
          </div>

          {availableCategories.length > 0 && (
            <div className="bg-canvas rounded-xl border border-hairline p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted uppercase tracking-[0.2em] shrink-0">Category</span>
                <Select
                  value={categoryFilter || ''}
                  onChange={v => setCategoryFilter(v || null)}
                  placeholder="All"
                  options={[
                    { value: '', label: `All (${dateFilteredCount})` },
                    ...availableCategories.map(cat => ({
                      value: cat,
                      label: `${cat} (${categoryCounts[cat]})`
                    }))
                  ]}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LedgerDesktopToolbar({
  dateView, setDateView,
  selectedMonth, setSelectedMonth,
  selectedDate, setSelectedDate,
  dateRangeStart, setDateRangeStart,
  dateRangeEnd, setDateRangeEnd,
  categoryFilter, setCategoryFilter,
  availableCategories, categoryCounts, dateFilteredCount,
  onAdd,
}: LedgerToolbarProps) {
  const modes = ['all', 'month', 'date', 'range'] as const;

  return (
    <div className="hidden md:block px-5 py-2 border-b border-hairline bg-surface-soft/20">
      <div className="flex items-center gap-x-2">
        <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mr-1 shrink-0">Entries</h4>
        {modes.map(mode => (
          <button
            key={mode}
            onClick={() => setDateView(mode)}
            className={`px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
              dateView === mode
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface-strong'
            }`}
          >
            {mode === 'all' && 'All'}
            {mode === 'month' && 'Month'}
            {mode === 'date' && 'Date'}
            {mode === 'range' && 'Range'}
          </button>
        ))}
        {dateView === 'month' && (
          <DatePicker mode="month" value={selectedMonth + '-01'} onChange={v => setSelectedMonth(v.slice(0, 7))} className="w-[160px]" />
        )}
        {dateView === 'date' && (
          <DatePicker value={selectedDate} onChange={v => setSelectedDate(v)} className="w-[160px]" />
        )}
        {dateView === 'range' && (
          <div className="flex items-center gap-1">
            <DatePicker value={dateRangeStart} onChange={v => setDateRangeStart(v)} className="w-[140px]" />
            <span className="text-[10px] text-muted font-bold">—</span>
            <DatePicker value={dateRangeEnd} onChange={v => setDateRangeEnd(v)} className="w-[140px]" />
          </div>
        )}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <Select
              value={categoryFilter || ''}
              onChange={v => setCategoryFilter(v || null)}
              placeholder="All"
              options={[
                { value: '', label: `All (${dateFilteredCount})` },
                ...availableCategories.map(cat => ({
                  value: cat,
                  label: `${cat} (${categoryCounts[cat]})`
                }))
              ]}
              className="w-[160px]"
            />
          </div>
        )}
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-[10px] px-3.5 py-1.5">
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>
    </div>
  );
}
