import React, { useState, useEffect } from 'react';
import { Account, Investment, InvestmentReturn } from '../types';
import { Plus, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import Select from './Select';
import DatePicker from './DatePicker';
import InvestmentDetail from './InvestmentDetail';

interface InvestmentTrackerProps {
  accounts: Account[];
  onUpdate: () => void;
  currency: string;
}

export default function InvestmentTracker({ accounts, onUpdate, currency }: InvestmentTrackerProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [returns, setReturns] = useState<InvestmentReturn[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newInv, setNewInv] = useState({
    account_id: '',
    principal: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchInvestments = async () => {
    const local = await localDb.getInvestments();
    setInvestments(local.map(i => ({
      id: i.server_id ?? 0,
      account_id: Number(i.account_id),
      account_name: '',
      principal: i.principal,
      date: i.date,
    })));
  };

  const fetchReturns = async (_id: number) => {
    const local = await localDb.getInvestmentReturns();
    setReturns(local.map(r => ({
      id: r.server_id ?? 0,
      investment_id: Number(r.investment_id),
      date: r.date,
      amount: r.amount,
      percentage: r.percentage ?? 0,
    })));
  };

  useEffect(() => { fetchInvestments(); }, []);
  useEffect(() => { if (selectedInv) fetchReturns(selectedInv.id); }, [selectedInv]);

  const handleCreateInv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record = {
        id: generateId(),
        account_id: newInv.account_id,
        principal: parseFloat(newInv.principal),
        date: newInv.date,
        updated_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        _deleted: false,
      };
      await localDb.putInvestment(record);
      setIsAdding(false);
      fetchInvestments();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="text-lg md:text-2xl lg:text-3xl font-normal text-ink tracking-tight">Investments</h3>
          <p className="text-xs md:text-sm text-muted font-medium">Track asset performance.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 self-start">
          <Plus className="w-4 md:w-5 h-4 md:h-5" />
          Add
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="overflow-hidden"
          >
            <div className="card-xl border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h4 className="text-base md:text-lg font-normal text-ink">New Investment</h4>
                <button onClick={() => setIsAdding(false)} className="p-1 md:p-2 text-muted hover:text-ink">×</button>
              </div>
              <form onSubmit={handleCreateInv} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Account</label>
                  <Select
                    value={newInv.account_id}
                    onChange={v => setNewInv({...newInv, account_id: v})}
                    placeholder="Select Account"
                    options={accounts.filter(a => a.type === 'investment').map(a => ({ value: String(a.id), label: a.name }))}
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Principal</label>
                  <input type="number" required value={newInv.principal} onChange={e => setNewInv({...newInv, principal: e.target.value})}
                    placeholder="0.00" className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm financial-number" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Date</label>
                  <DatePicker value={newInv.date} onChange={v => setNewInv({...newInv, date: v})} />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 md:gap-4 pt-4 md:pt-6">
                  <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3">Cancel</button>
                  <button type="submit" className="btn-primary text-xs md:text-sm px-6 md:px-10 py-2 md:py-3">Save</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          <h4 className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Portfolio</h4>
          <div className="space-y-3">
            {investments.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInv(inv)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all text-left relative overflow-hidden group",
                  selectedInv?.id === inv.id 
                    ? "bg-canvas border-primary shadow-md shadow-primary/5" 
                    : "bg-surface-soft border-hairline hover:border-primary/20"
                )}
              >
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className={cn(
                    "p-1.5 rounded-full border transition-colors shrink-0",
                    selectedInv?.id === inv.id ? "bg-primary/5 border-primary/10 text-primary" : "bg-canvas border-hairline text-muted"
                  )}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-base font-semibold text-ink truncate">{inv.account_name}</h5>
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Started {format(new Date(inv.date), 'MMM yyyy')}</p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform shrink-0",
                    selectedInv?.id === inv.id ? "text-primary translate-x-1" : "text-muted/40"
                  )} />
                </div>
                <p className="text-lg font-bold financial-number text-ink">{currency}{inv.principal.toLocaleString()}</p>
                {selectedInv?.id === inv.id && <div className="absolute top-0 right-0 w-2 h-full bg-primary" />}
              </button>
            ))}
            {investments.length === 0 && (
              <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline text-muted font-medium italic">
                No active positions found in current ledger.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedInv ? (
            <InvestmentDetail
              investment={selectedInv}
              returns={returns}
              currency={currency}
              onAddReturn={() => {}}
              onRefresh={() => fetchReturns(selectedInv.id)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center card-xl p-24 text-center space-y-8 bg-surface-soft/30 border-dashed">
              <div className="p-8 bg-canvas border border-hairline rounded-full shadow-sm">
                <TrendingUp className="w-16 h-16 text-muted/20" />
              </div>
              <div>
                <h4 className="text-2xl font-normal text-ink tracking-tight">Audit a Position</h4>
                <p className="text-sm text-muted max-w-xs mx-auto font-medium leading-relaxed">Select a portfolio asset from the ledger to perform a comprehensive performance audit and yield analysis.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
