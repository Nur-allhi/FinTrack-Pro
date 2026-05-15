import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Download, 
  Loader2,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { format } from 'date-fns';
import { cacheService } from '../services/cacheService';
import { exportLedgerPDF } from '../utils/ledgerPdf';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import Select from './Select';
import DatePicker from './DatePicker';

// Sub-components
import TransactionForm from './TransactionForm';
import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
  lastUpdate?: number;
  currency: string;
}



export default function Ledger({ account, onBack, onUpdate, lastUpdate, currency }: LedgerProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTx, setNewTx] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateView, setDateView] = useState<'all' | 'month' | 'date' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeStart, setDateRangeStart] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeEnd, setDateRangeEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) return setLoading(false);
    if (showLoading) setLoading(true);
    else setIsSyncing(true);
    
    try {
      const res = await authService.apiFetch(`/api/transactions/${account.id}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setTransactions(data);
      cacheService.setTransactions(account.id.toString(), data);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!account?.id) return;
      if (transactions.length > 0) return fetchTransactions(false);
      const cached = await cacheService.getTransactions(account.id.toString());
      if (cached) { setTransactions(cached); setLoading(false); fetchTransactions(false); }
      else fetchTransactions(true);
    };
    load();
    authService.apiFetch('/api/transactions/categories')
      .then(res => res.json())
      .then(setAllCategories)
      .catch(() => {});
  }, [account.id, lastUpdate]);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    let category = newTx.category;
    let summary = editingTx?.summary || null;

    const optimisticTx: Transaction = {
      id: editingTx ? editingTx.id : Date.now(),
      account_id: account.id,
      date: newTx.date,
      particulars: newTx.particulars,
      category: category || 'Uncategorized',
      amount: amount,
      type: editingTx?.type || 'normal',
      summary: summary,
      linked_transaction_id: editingTx?.linked_transaction_id || null
    };

    const prev = [...transactions];
    if (editingTx) setTransactions(transactions.map(t => t.id === editingTx.id ? optimisticTx : t));
    else setTransactions([optimisticTx, ...transactions]);

    setIsAdding(false);
    setEditingTx(null);
    setNewTx({ date: format(new Date(), 'yyyy-MM-dd'), particulars: '', amount: '', isCredit: false, category: '' });

    try {
      const method = editingTx ? 'PATCH' : 'POST';
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      const res = await authService.apiFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount, summary })
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setTransactions(p => p.map(t => t.id === optimisticTx.id ? { ...t, id: saved.id } : t));
      onUpdate();
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to save transaction.", 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const prev = [...transactions];
    setTransactions(transactions.filter(t => t.id !== id));
    setDeletingId(null);
    try {
      const res = await authService.apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      onUpdate();
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to delete transaction.", 'error');
    }
  };

  const txsWithBalance = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id)
    .reduce((acc, tx) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.initial_balance);
      acc.push({ ...tx, runningBalance: prevBal + Number(tx.amount) });
      return acc;
    }, [] as (Transaction & { runningBalance: number })[])
    .reverse();

  const categoryCounts = transactions.reduce<Record<string, number>>((acc, tx) => {
    const cat = tx.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const availableCategories = Object.keys(categoryCounts).sort((a, b) =>
    categoryCounts[b] - categoryCounts[a]
  );

  const dateFilteredTxs = txsWithBalance.filter(tx => {
    if (dateView === 'all') return true;
    if (dateView === 'month') return tx.date.startsWith(selectedMonth);
    if (dateView === 'date') return tx.date === selectedDate;
    if (dateView === 'range') return tx.date >= dateRangeStart && tx.date <= dateRangeEnd;
    return true;
  });

  const filteredTxs = categoryFilter
    ? dateFilteredTxs.filter(tx => (tx.category || 'Uncategorized') === categoryFilter)
    : dateFilteredTxs;

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 md:gap-3 text-muted hover:text-ink transition-colors font-semibold text-[10px] md:text-sm">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to Portfolio
        </button>
        <button onClick={() => exportLedgerPDF(filteredTxs, account.name, currency, account.initial_balance)} className="p-2 md:p-3 text-muted hover:text-ink hover:bg-surface-soft rounded-full border border-hairline transition-all">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="bg-canvas rounded-xl border border-hairline shadow-sm" aria-label="Transaction Ledger">
        <div className="p-4 md:p-5 flex items-center justify-between bg-primary/5 border-b border-hairline">
          <div>
            <h3 className="text-base md:text-xl font-normal text-ink tracking-tight">{account.name}</h3>
            <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{account.type.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
              {isSyncing && <Loader2 className="w-2.5 md:w-3 h-2.5 md:h-3 animate-spin text-primary" />}
              <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Balance</p>
            </div>
            <p className="text-xl md:text-3xl font-normal text-ink financial-number tracking-tighter">
              {currency}{account.current_balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Desktop toolbar */}
        <div className="hidden md:block px-5 py-2 border-b border-hairline bg-surface-soft/20">
          <div className="flex items-center gap-x-2">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mr-1 shrink-0">Entries</h4>
            {(['all', 'month', 'date', 'range'] as const).map(mode => (
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
                <span className="text-[9px] text-muted font-bold">—</span>
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
                    { value: '', label: `All (${dateFilteredTxs.length})` },
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
              <button onClick={() => setIsAdding(true)} className="btn-primary text-[10px] px-3.5 py-1.5">
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </div>
        </div>

        {/* Mobile toolbar: Entries header + filter toggle */}
        <div className="md:hidden px-4 py-2.5 border-b border-hairline bg-canvas flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Entries</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
                showFilters || dateView !== 'all' || categoryFilter ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <button onClick={() => setIsAdding(true)} className="btn-primary text-[10px] px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>

        {/* Mobile filter cards */}
        {showFilters && (
          <div className="md:hidden px-4 py-3 space-y-3 border-b border-hairline bg-surface-soft/20">
            <div className="bg-canvas rounded-xl border border-hairline p-3 space-y-3">
              <div className="flex items-center gap-1.5">
                {(['all', 'month', 'date', 'range'] as const).map(mode => (
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
                  <span className="text-[10px] text-muted font-bold">—</span>
                  <DatePicker value={dateRangeEnd} onChange={v => setDateRangeEnd(v)} className="flex-1" />
                </div>
              )}
            </div>

            {availableCategories.length > 0 && (
              <div className="bg-canvas rounded-xl border border-hairline p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] shrink-0">Category</span>
                  <Select
                    value={categoryFilter || ''}
                    onChange={v => setCategoryFilter(v || null)}
                    placeholder="All"
                    options={[
                      { value: '', label: `All (${dateFilteredTxs.length})` },
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

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-4 md:p-5 bg-surface-soft/50 border-b border-hairline">
                <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} availableCategories={allCategories} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em] border-b border-hairline">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredTxs.map((tx, idx) => (
                  <TransactionRow 
                    key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                    isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-hairline">
          <AnimatePresence initial={false}>
            {filteredTxs.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
        {filteredTxs.length === 0 && (
          <div className="px-6 md:px-12 py-16 md:py-32 text-center bg-canvas">
            <div className="w-12 md:w-20 h-12 md:h-20 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 border border-hairline">
              <Plus className="w-6 md:w-10 h-6 md:h-10 text-muted" />
            </div>
            <p className="text-base md:text-xl font-normal text-ink mb-1 md:mb-2">
              {categoryFilter || dateView !== 'all' ? 'No matching records' : 'No records found'}
            </p>
            <p className="text-xs md:text-sm text-muted mb-4 md:mb-8">
              {categoryFilter ? 'Try a different category filter.' : dateView !== 'all' ? 'Try a different date range.' : 'Post your first ledger entry.'}
            </p>
            <button onClick={() => setIsAdding(true)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3 mx-auto">Add Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
