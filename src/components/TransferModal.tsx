import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Account } from '../types';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import Select from './Select';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  currency: string;
}

export default function TransferModal({ accounts, onClose, onUpdate, currency }: TransferModalProps) {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [closing, setClosing] = useState(false);
  const isWriting = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };
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
    if (isWriting.current) return;
    isWriting.current = true;

    try {
      const amount = parseFloat(transfer.amount);
      const now = new Date().toISOString();
      const creditId = generateId();
      const debitId = generateId();

      const creditTx = {
        id: creditId,
        account_id: transfer.to_account_id,
        date: transfer.date,
        particulars: transfer.particulars || 'Transfer',
        category: 'Transfer',
        amount,
        type: 'transfer' as const,
        linked_transaction_id: debitId,
        summary: null,
        updated_at: now,
        sync_status: 'pending' as const,
        _deleted: false,
      };

      const debitTx = {
        id: debitId,
        account_id: transfer.from_account_id,
        date: transfer.date,
        particulars: transfer.particulars || 'Transfer',
        category: 'Transfer',
        amount: -amount,
        type: 'transfer' as const,
        linked_transaction_id: creditId,
        summary: null,
        updated_at: now,
        sync_status: 'pending' as const,
        _deleted: false,
      };

      await Promise.all([
        localDb.putTransaction(creditTx),
        localDb.putTransaction(debitTx),
      ]);

      setSuccess(true);
      toast("Transfer completed.", 'success');
      onUpdate();
    } catch (error) {
      console.error("Transfer failed:", error);
      toast("Transfer failed.", 'error');
    } finally {
      isWriting.current = false;
    }
  };

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={closing ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-surface-dark/40 backdrop-blur-sm" onClick={handleClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()} className="bg-canvas w-full max-w-[28rem] md:max-w-[32rem] lg:max-w-[42rem] rounded-xl border border-hairline shadow-2xl">
        <div className="p-4 sm:p-6 md:p-10 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
          <h3 className="text-lg sm:text-2xl font-normal text-ink tracking-tight">Inter-Account Transfer</h3>
          <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted hover:text-ink transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-10 lg:p-12">
          {success ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-semantic-up/10 rounded-full flex items-center justify-center text-semantic-up shadow-lg shadow-semantic-up/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-2xl font-normal text-ink mb-2">Transfer Successful</h4>
                <p className="text-sm text-muted font-medium">The funds have been moved and institutional ledgers updated.</p>
              </div>
              <button onClick={handleClose} className="btn-primary px-8 mt-4">Return to Dashboard</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Source Account</label>
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
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Destination Account</label>
                  <Select
                    value={transfer.to_account_id}
                    onChange={v => setTransfer({...transfer, to_account_id: v})}
                    placeholder="Select Destination"
                    options={accounts.filter(a => !a.archived).map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} · ${a.member_name} (${currency}${a.current_balance.toLocaleString()})` : `${a.name} (${currency}${a.current_balance.toLocaleString()})` }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Amount ({currency})</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      required
                      value={transfer.amount}
                      onChange={e => setTransfer({...transfer, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
                    <DatePicker
                      value={transfer.date}
                      onChange={v => setTransfer({...transfer, date: v})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Transaction Description</label>
                  <input 
                    type="text" 
                    required
                    value={transfer.particulars}
                    onChange={e => setTransfer({...transfer, particulars: e.target.value})}
                    placeholder="Institutional memo"
                    className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="btn-secondary flex-1 h-11"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-[2] h-11 text-sm"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
