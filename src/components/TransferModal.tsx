import React, { useState } from 'react';
import { Account } from '../types';
import { X, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import Select from './Select';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  currency: string;
}

export default function TransferModal({ accounts, onClose, onUpdate, currency }: TransferModalProps) {
  const { toast } = useToast();
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
      toast("Source and destination accounts must be different.", 'error');
      return;
    }

    setLoading(true);
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
      
      if (!res.ok) throw new Error("Transfer failed");
      
      setSuccess(true);
      toast("Transfer completed successfully.", 'success');
      onUpdate();
    } catch (error) {
      console.error("Transfer failed:", error);
      toast("Transfer failed. Please check your balance.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-surface-dark/40 backdrop-blur-sm">
      <div className="bg-canvas w-full max-w-lg rounded-xl border border-hairline shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
          <h3 className="text-2xl font-normal text-ink tracking-tight">Inter-Account Transfer</h3>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10">
          {success ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-semantic-up/10 rounded-full flex items-center justify-center text-semantic-up shadow-lg shadow-semantic-up/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-2xl font-normal text-ink mb-2">Transfer Successful</h4>
                <p className="text-sm text-muted font-medium">The funds have been moved and institutional ledgers updated.</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 mt-4">Return to Dashboard</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Source Account</label>
                  <Select
                    value={transfer.from_account_id}
                    onChange={v => setTransfer({...transfer, from_account_id: v})}
                    placeholder="Select Source"
                    options={accounts.filter(a => !a.archived).map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} · ${a.member_name} (${currency}${a.current_balance.toLocaleString()})` : `${a.name} (${currency}${a.current_balance.toLocaleString()})` }))}
                  />
                </div>

                <div className="flex justify-center -my-3 relative z-10">
                  <div className="bg-canvas p-2 rounded-full border border-hairline shadow-sm">
                    <ArrowRight className="w-4 h-4 text-primary rotate-90 md:rotate-0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Destination Account</label>
                  <Select
                    value={transfer.to_account_id}
                    onChange={v => setTransfer({...transfer, to_account_id: v})}
                    placeholder="Select Destination"
                    options={accounts.filter(a => !a.archived).map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} · ${a.member_name} (${currency}${a.current_balance.toLocaleString()})` : `${a.name} (${currency}${a.current_balance.toLocaleString()})` }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Amount ({currency})</label>
                    <input 
                      type="number" 
                      required
                      value={transfer.amount}
                      onChange={e => setTransfer({...transfer, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
                    <DatePicker
                      value={transfer.date}
                      onChange={v => setTransfer({...transfer, date: v})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Transaction Description</label>
                  <input 
                    type="text" 
                    required
                    value={transfer.particulars}
                    onChange={e => setTransfer({...transfer, particulars: e.target.value})}
                    placeholder="Institutional memo"
                    className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn-secondary flex-1 h-[56px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-[2] h-[56px] text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Authorize Transfer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
