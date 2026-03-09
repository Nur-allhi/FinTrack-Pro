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
import { format } from 'date-fns';
import { categorizeTransaction } from '../services/geminiService';
import { cacheService } from '../services/cacheService';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
}

export default function Ledger({ account, onBack, onUpdate }: LedgerProps) {
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

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) {
      console.warn("fetchTransactions skipped: No account ID");
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
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
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("Network error detected. The server might be restarting.");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const loadCacheAndFetch = async () => {
      if (!account?.id) return;
      
      // Load from cache first
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
  }, [account.id]);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    
    let category = newTx.category;
    let summary = editingTx?.summary || null;

    if (!category && !editingTx) {
      setAiLoading(true);
      const aiResult = await categorizeTransaction(newTx.particulars);
      category = aiResult.category;
      summary = aiResult.summary;
      setAiLoading(false);
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

      setIsAdding(false);
      setEditingTx(null);
      setNewTx({
        date: format(new Date(), 'yyyy-MM-dd'),
        particulars: '',
        amount: '',
        isCredit: false,
        category: ''
      });
      fetchTransactions();
      onUpdate();
    } catch (error) {
      console.error(error);
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
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      setDeletingId(null);
      fetchTransactions();
      onUpdate();
    } catch (error) {
      console.error(error);
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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{account.name}</h3>
            <p className="text-sm text-slate-500 font-medium capitalize">{account.type.replace('_', ' ')} Ledger</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-primary financial-number">৳{account.current_balance.toLocaleString()}</p>
          </div>
        </div>

        {isAdding && (
          <div className="p-6 bg-primary/5 border-b border-primary/10">
            <form onSubmit={handleAddOrUpdateTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input 
                type="date" 
                required
                value={newTx.date}
                onChange={e => setNewTx({...newTx, date: e.target.value})}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <input 
                type="text" 
                placeholder="Particulars (Bengali/English)"
                required
                value={newTx.particulars}
                onChange={e => setNewTx({...newTx, particulars: e.target.value})}
                className="md:col-span-2 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  required
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
                />
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, isCredit: !newTx.isCredit})}
                  className={`px-3 rounded-xl font-bold text-xs uppercase transition-colors ${newTx.isCredit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                >
                  {newTx.isCredit ? 'Credit' : 'Debit'}
                </button>
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
              <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Particulars</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {txsWithBalance.map((tx, index) => {
                const prevTx = txsWithBalance[index - 1];
                const isNewDate = !prevTx || prevTx.date !== tx.date;
                const isExpanded = expandedId === tx.id;
                
                return (
                  <React.Fragment key={tx.id}>
                    {isNewDate && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={7} className="px-6 py-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {format(new Date(tx.date), 'EEEE, dd MMMM yyyy')}
                          </p>
                        </td>
                      </tr>
                    )}
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                      className={`cursor-pointer transition-colors group ${isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        <div className="w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{tx.particulars}</p>
                        {tx.summary && !isExpanded && <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-[200px]">{tx.summary}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                          {tx.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-rose-500 financial-number">
                        {tx.amount < 0 ? `৳${Math.abs(tx.amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-emerald-500 financial-number">
                        {tx.amount > 0 ? `৳${tx.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 financial-number">
                        ৳{tx.runningBalance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-primary/5">
                        <td colSpan={7} className="px-6 py-4 border-t border-primary/10">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3">
                              {tx.summary && (
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Summary</p>
                                  <p className="text-sm text-slate-600 italic leading-relaxed max-w-2xl">{tx.summary}</p>
                                </div>
                              )}
                              <div className="flex gap-6">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                                  <p className="text-sm font-bold text-slate-700">{tx.category || 'Uncategorized'}</p>
                                </div>
                                {(tx as any).linked_account_name && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      {tx.amount < 0 ? 'Transferred To' : 'Transferred From'}
                                    </p>
                                    <p className="text-sm font-bold text-primary">{(tx as any).linked_account_name}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</p>
                                  <p className="text-sm font-mono text-slate-500">#{tx.id}</p>
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
                                    className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {txsWithBalance.map((tx, index) => {
            const prevTx = txsWithBalance[index - 1];
            const isNewDate = !prevTx || prevTx.date !== tx.date;
            const isExpanded = expandedId === tx.id;

            return (
              <React.Fragment key={tx.id}>
                {isNewDate && (
                  <div className="bg-slate-50 px-5 py-2 border-y border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {format(new Date(tx.date), 'EEEE, dd MMMM yyyy')}
                    </p>
                  </div>
                )}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  className={`p-5 space-y-4 transition-colors cursor-pointer ${isExpanded ? 'bg-primary/5' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{tx.particulars}</p>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                        {tx.category || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold financial-number ${tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {tx.amount < 0 ? '-' : '+'}৳{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">
                        Bal: <span className="text-slate-900 font-bold">৳{tx.runningBalance.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="pt-4 space-y-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                      {tx.summary && (
                        <div className="bg-white/50 p-3 rounded-xl border border-primary/5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Summary</p>
                          <p className="text-xs text-slate-600 italic leading-relaxed">{tx.summary}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 p-3 rounded-xl border border-primary/5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                          <p className="text-xs font-bold text-slate-700">{tx.category || 'Uncategorized'}</p>
                        </div>
                        {(tx as any).linked_account_name && (
                          <div className="bg-white/50 p-3 rounded-xl border border-primary/5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                              className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:bg-slate-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:bg-rose-50 active:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
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
