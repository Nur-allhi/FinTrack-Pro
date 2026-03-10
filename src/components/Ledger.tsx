import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Sparkles,
  Loader2,
  ChevronDown,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { categorizeTransaction } from '../services/geminiService';
import { cacheService } from '../services/cacheService';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
  lastUpdate?: number;
  currency: string;
}

export default function Ledger({ account, onBack, onUpdate, lastUpdate, currency }: LedgerProps) {
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
  const [aiLoading, setAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) {
      console.warn("fetchTransactions skipped: No account ID");
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    else setIsSyncing(true);
    
    try {
      const res = await fetch(`/api/transactions/${account.id}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      setTransactions(data);
      // Update cache
      cacheService.setTransactions(account.id.toString(), data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      if (showLoading) setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadCacheAndFetch = async () => {
      if (!account?.id) return;
      
      // If we already have transactions and this is just a refresh trigger,
      // don't reload from cache (which might be stale), just fetch fresh data.
      if (transactions.length > 0) {
        fetchTransactions(false);
        return;
      }

      // Load from cache first for initial mount
      const cachedData = await cacheService.getTransactions(account.id.toString());
      if (cachedData) {
        setTransactions(cachedData);
        setLoading(false);
        // Fetch fresh in background
        fetchTransactions(false);
      } else {
        // No cache, show loading and fetch
        fetchTransactions(true);
      }
    };
    
    loadCacheAndFetch();
  }, [account.id, lastUpdate]);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    
    let category = newTx.category;
    let summary = editingTx?.summary || null;

    // Optimistic UI Update
    const optimisticTx: Transaction = {
      id: editingTx ? editingTx.id : Date.now(), // Use large positive ID for stable sorting
      account_id: account.id,
      date: newTx.date,
      particulars: newTx.particulars,
      category: category || 'Categorizing...',
      amount: amount,
      type: editingTx?.type || 'normal',
      summary: summary,
      linked_transaction_id: editingTx?.linked_transaction_id || null
    };

    const previousTransactions = [...transactions];
    if (editingTx) {
      setTransactions(transactions.map(t => t.id === editingTx.id ? optimisticTx : t));
    } else {
      setTransactions([optimisticTx, ...transactions]);
    }

    setIsAdding(false);
    setEditingTx(null);
    setNewTx({
      date: format(new Date(), 'yyyy-MM-dd'),
      particulars: '',
      amount: '',
      isCredit: false,
      category: ''
    });

    // Trigger parent update for balance (optimistic update for balance is harder since it's in parent)
    // But we can at least trigger the sync
    onUpdate();

    if (!category && !editingTx) {
      setAiLoading(true);
      try {
        const aiResult = await categorizeTransaction(newTx.particulars);
        category = aiResult.category;
        summary = aiResult.summary;
        
        // Update optimistic item with AI results
        setTransactions(prev => prev.map(t => t.id === optimisticTx.id ? { ...t, category, summary } : t));
      } catch (err) {
        console.error("AI Categorization failed", err);
      } finally {
        setAiLoading(false);
      }
    }

    try {
      const method = editingTx ? 'PATCH' : 'POST';
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          date: newTx.date,
          particulars: newTx.particulars,
          category,
          amount,
          summary
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const savedTx = await res.json();
      
      // Replace optimistic ID with real ID
      setTransactions(prev => prev.map(t => t.id === optimisticTx.id ? { ...t, id: savedTx.id } : t));
      
      // Refresh to ensure everything is in sync (background)
      fetchTransactions(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      // Rollback on error
      setTransactions(previousTransactions);
      alert("Failed to save transaction. Please try again.");
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setNewTx({
      date: tx.date,
      particulars: tx.particulars,
      amount: Math.abs(tx.amount).toString(),
      isCredit: tx.amount > 0,
      category: tx.category || ''
    });
    setIsAdding(true);
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    const previousTransactions = [...transactions];
    // Optimistic delete
    setTransactions(transactions.filter(t => t.id !== id));
    setDeletingId(null);
    onUpdate();

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      
      // Background sync
      fetchTransactions(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      // Rollback
      setTransactions(previousTransactions);
      alert("Failed to delete transaction.");
    }
  };

  // Calculate running balance
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);
  let currentBalance = Number(account.initial_balance);
  const txsWithBalance = sortedTxs.map(tx => {
    currentBalance += Number(tx.amount);
    return { ...tx, runningBalance: currentBalance };
  }).reverse();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{account.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">{account.type.replace('_', ' ')} Ledger</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-primary/40" />}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Balance</p>
            </div>
            <p className="text-2xl font-bold text-primary financial-number">{currency}{account.current_balance.toLocaleString()}</p>
          </div>
        </div>

        {isAdding && (
          <div className="p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10 dark:border-primary/20">
            <form onSubmit={handleAddOrUpdateTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input 
                type="date" 
                required
                value={newTx.date}
                onChange={e => setNewTx({...newTx, date: e.target.value})}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <input 
                type="text" 
                placeholder="Particulars (Bengali/English)"
                required
                value={newTx.particulars}
                onChange={e => setNewTx({...newTx, particulars: e.target.value})}
                className="md:col-span-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <div className="flex flex-col gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  required
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
                />
                <div className="flex p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewTx({...newTx, isCredit: false})}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${!newTx.isCredit ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    DEBIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTx({...newTx, isCredit: true})}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${newTx.isCredit ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    CREDIT
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={aiLoading}
                  className="flex-1 bg-primary text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setEditingTx(null); }}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Particulars</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence initial={false}>
                {txsWithBalance.map((tx, index) => {
                  const prevTx = txsWithBalance[index - 1];
                  const isNewDate = !prevTx || prevTx.date !== tx.date;
                  const isExpanded = expandedId === tx.id;
                  
                  return (
                    <React.Fragment key={tx.id}>
                      {isNewDate && (
                        <motion.tr 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-slate-50/80 dark:bg-slate-800/80"
                        >
                          <td colSpan={7} className="px-6 py-2">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                              {format(new Date(tx.date), 'EEEE, dd MMMM yyyy')}
                            </p>
                          </td>
                        </motion.tr>
                      )}
                      <motion.tr 
                        layout="position"
                        key={tx.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                        className={`cursor-pointer transition-colors group ${isExpanded ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
                      >
                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                          <div className="w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{tx.particulars}</p>
                          {tx.summary && !isExpanded && <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5 truncate max-w-[200px]">{tx.summary}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-wider">
                            {tx.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-rose-500 financial-number">
                          {tx.amount < 0 ? `${currency}${Math.abs(tx.amount).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-500 financial-number">
                          {tx.amount > 0 ? `${currency}${tx.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-slate-100 financial-number">
                          {currency}{tx.runningBalance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </td>
                      </motion.tr>
                      {isExpanded && (
                        <motion.tr 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-primary/5 dark:bg-primary/10"
                        >
                          <td colSpan={7} className="px-6 py-4 border-t border-primary/10 dark:border-primary/20">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                {tx.summary && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">AI Summary</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed max-w-2xl">{tx.summary}</p>
                                  </div>
                                )}
                                <div className="flex gap-6">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{tx.category || 'Uncategorized'}</p>
                                  </div>
                                  {(tx as any).linked_account_name && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        {tx.amount < 0 ? 'Transferred To' : 'Transferred From'}
                                      </p>
                                      <p className="text-sm font-bold text-primary">{(tx as any).linked_account_name}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Transaction ID</p>
                                    <p className="text-sm font-mono text-slate-500 dark:text-slate-400">#{tx.id}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {deletingId === tx.id ? (
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                      className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      Edit
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-white hover:border-rose-500 transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          <AnimatePresence initial={false}>
            {txsWithBalance.map((tx, index) => {
              const prevTx = txsWithBalance[index - 1];
              const isNewDate = !prevTx || prevTx.date !== tx.date;
              const isExpanded = expandedId === tx.id;

              return (
                <React.Fragment key={tx.id}>
                  {isNewDate && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-50 dark:bg-slate-800 px-5 py-2 border-y border-slate-100 dark:border-slate-800"
                    >
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        {format(new Date(tx.date), 'EEEE, dd MMMM yyyy')}
                      </p>
                    </motion.div>
                  )}
                  <motion.div 
                    layout="position"
                    key={tx.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    className={`p-5 space-y-4 transition-colors cursor-pointer ${isExpanded ? 'bg-primary/5 dark:bg-primary/10' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{tx.particulars}</p>
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-wider">
                          {tx.category || 'Uncategorized'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold financial-number ${tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {tx.amount < 0 ? '-' : '+'}{currency}{Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                          Bal: <span className="text-slate-900 dark:text-slate-100 font-bold">{currency}{tx.runningBalance.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 space-y-4 border-t border-primary/10 dark:border-primary/20"
                      >
                        {tx.summary && (
                          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-primary/5 dark:border-primary/10">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">AI Summary</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">{tx.summary}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-primary/5 dark:border-primary/10">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{tx.category || 'Uncategorized'}</p>
                          </div>
                          {(tx as any).linked_account_name && (
                            <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-primary/5 dark:border-primary/10">
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                {tx.amount < 0 ? 'To Account' : 'From Account'}
                              </p>
                              <p className="text-xs font-bold text-primary">{(tx as any).linked_account_name}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          {deletingId === tx.id ? (
                            <div className="flex items-center gap-2 w-full">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
                              >
                                Confirm Delete
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:bg-slate-50 dark:active:bg-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:bg-rose-50 dark:active:bg-rose-900/20 active:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>

        {txsWithBalance.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-400 font-medium">
            No transactions found for this account.
          </div>
        )}
      </div>
    </div>
  );
}
