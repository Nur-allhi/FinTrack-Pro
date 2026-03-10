import React, { useState } from 'react';
import { Account } from '../types';
import { X, ArrowRight, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  currency: string;
}

export default function TransferModal({ accounts, onClose, onUpdate, currency }: TransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transfer, setTransfer] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    particulars: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transfer.from_account_id === transfer.to_account_id) {
      alert("Source and destination accounts must be different.");
      return;
    }

    // Close instantly for better UX
    onClose();
    // Trigger update immediately
    onUpdate();

    // Perform the rest in the background
    (async () => {
      try {
        const res = await fetch('/api/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...transfer,
            from_account_id: Number(transfer.from_account_id),
            to_account_id: Number(transfer.to_account_id),
            amount: parseFloat(transfer.amount)
          })
        });
        
        if (!res.ok) {
          throw new Error("Transfer failed");
        }
        
        // Final sync
        onUpdate();
      } catch (error) {
        console.error("Background transfer failed:", error);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Inter-Account Transfer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transfer Successful</h4>
                <p className="text-slate-500 dark:text-slate-400">The funds have been moved and ledgers updated.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">From Account</label>
                  <div className="relative">
                    <select 
                      required
                      value={transfer.from_account_id}
                      onChange={e => setTransfer({...transfer, from_account_id: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Select Source</option>
                      {accounts.filter(a => !a.archived).map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} {a.member_name ? `(${a.member_name})` : ''} ({currency}{a.current_balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center -my-3 relative z-10">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                    <ArrowRight className="w-5 h-5 text-primary rotate-90 md:rotate-0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">To Account</label>
                  <div className="relative">
                    <select 
                      required
                      value={transfer.to_account_id}
                      onChange={e => setTransfer({...transfer, to_account_id: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Select Destination</option>
                      {accounts.filter(a => !a.archived).map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} {a.member_name ? `(${a.member_name})` : ''} ({currency}{a.current_balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount ({currency})</label>
                    <input 
                      type="number" 
                      required
                      value={transfer.amount}
                      onChange={e => setTransfer({...transfer, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      required
                      value={transfer.date}
                      onChange={e => setTransfer({...transfer, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Particulars</label>
                  <input 
                    type="text" 
                    required
                    value={transfer.particulars}
                    onChange={e => setTransfer({...transfer, particulars: e.target.value})}
                    placeholder="Reason for transfer"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-primary text-white font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Confirm Transfer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
