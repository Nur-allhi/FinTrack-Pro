import React, { useState, useEffect } from 'react';
import { Account, Investment, InvestmentReturn } from '../types';
import { Plus, TrendingUp, ArrowUpRight, ChevronRight, X } from 'lucide-react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '../utils/cn';
import { authService } from '../services/authService';
import Select from './Select';

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
  const [isAddingReturn, setIsAddingReturn] = useState(false);
  
  const [newInv, setNewInv] = useState({
    account_id: '',
    principal: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [newReturn, setNewReturn] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    percentage: ''
  });

  const fetchInvestments = async () => {
    const res = await authService.apiFetch('/api/investments');
    setInvestments(await res.json());
  };

  const fetchReturns = async (id: number) => {
    const res = await authService.apiFetch(`/api/investments/${id}/returns`);
    setReturns(await res.json());
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  useEffect(() => {
    if (selectedInv) fetchReturns(selectedInv.id);
  }, [selectedInv]);

  const handleCreateInv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.apiFetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInv,
          account_id: Number(newInv.account_id),
          principal: parseFloat(newInv.principal)
        })
      });
      setIsAdding(false);
      fetchInvestments();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    try {
      await authService.apiFetch(`/api/investments/${selectedInv.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReturn,
          amount: parseFloat(newReturn.amount),
          percentage: parseFloat(newReturn.percentage)
        })
      });
      setIsAddingReturn(false);
      fetchReturns(selectedInv.id);
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const chartData = [...returns].reverse().map(r => ({
    date: format(new Date(r.date), 'MMM yy'),
    amount: r.amount,
    percentage: r.percentage
  }));

  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

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

      {isAdding && (
        <div className="card-xl border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-normal text-ink">New Investment</h4>
            <button onClick={() => setIsAdding(false)} className="p-1 md:p-2 text-muted hover:text-ink">
              <X className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </div>
          <form onSubmit={handleCreateInv} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Account</label>
              <Select
                value={newInv.account_id}
                onChange={v => setNewInv({...newInv, account_id: v})}
                placeholder="Select Account"
                options={accounts.filter(a => a.type === 'investment').map(a => ({ value: String(a.id), label: a.name }))}
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Principal</label>
              <input type="number" required value={newInv.principal} onChange={e => setNewInv({...newInv, principal: e.target.value})}
                placeholder="0.00" className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm financial-number" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Date</label>
              <DatePicker value={newInv.date} onChange={v => setNewInv({...newInv, date: v})} />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 md:gap-4 pt-4 md:pt-6">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3">Cancel</button>
              <button type="submit" className="btn-primary text-xs md:text-sm px-6 md:px-10 py-2 md:py-3">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          <h4 className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Portfolio</h4>
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
                    <h5 className="text-sm font-semibold text-ink truncate">{inv.account_name}</h5>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Started {format(new Date(inv.date), 'MMM yyyy')}</p>
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
            <div className="card-xl space-y-12">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-3xl font-normal text-ink tracking-tight">{selectedInv.account_name}</h4>
                  <p className="text-sm text-muted font-medium mt-1">Institutional Principal: <span className="financial-number text-ink">{currency}{selectedInv.principal.toLocaleString()}</span></p>
                </div>
                <button 
                  onClick={() => setIsAddingReturn(true)}
                  className="btn-pill"
                >
                  <Plus className="w-4 h-4" />
                  Audit Yield
                </button>
              </div>

              {isAddingReturn && (
                <div className="p-8 bg-semantic-up/5 rounded-xl border border-semantic-up/10 shadow-sm shadow-semantic-up/5">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="text-sm font-bold text-semantic-up uppercase tracking-widest">Log Institutional Yield</h5>
                    <button onClick={() => setIsAddingReturn(false)} className="p-1 text-semantic-up/40 hover:text-semantic-up">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddReturn} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-semantic-up/60 uppercase tracking-widest">Value Date</label>
                      <DatePicker value={newReturn.date} onChange={v => setNewReturn({...newReturn, date: v})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-semantic-up/60 uppercase tracking-widest">Return ({currency})</label>
                      <input type="number" required value={newReturn.amount} onChange={e => setNewReturn({...newReturn, amount: e.target.value})} className="w-full px-4 py-2.5 bg-canvas border border-semantic-up/20 text-ink rounded-md outline-none text-sm financial-number" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-semantic-up/60 uppercase tracking-widest">Yield %</label>
                      <input type="number" step="0.01" required value={newReturn.percentage} onChange={e => setNewReturn({...newReturn, percentage: e.target.value})} className="w-full px-4 py-2.5 bg-canvas border border-semantic-up/20 text-ink rounded-md outline-none text-sm financial-number" />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-4 pt-2">
                      <button type="submit" className="btn-primary h-[48px] px-10 bg-semantic-up hover:bg-semantic-up/90 border-none">Save Yield Entry</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-soft rounded-xl border border-hairline">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Cumulative Yield</p>
                  <p className="text-xl font-bold text-semantic-up financial-number mt-1">{currency}{totalReturns.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-surface-soft rounded-xl border border-hairline">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Portfolio ROI</p>
                  <p className="text-xl font-bold text-primary financial-number mt-1">{((totalReturns / selectedInv.principal) * 100).toFixed(2)}%</p>
                </div>
              </div>

              <div className="h-64 w-full p-5 bg-canvas border border-hairline rounded-xl relative overflow-hidden">
                <div className="absolute top-5 left-5">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Yield Velocity</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052ff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0052ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dee1e6" />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#7c828a', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dee1e6', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0052ff', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0052ff" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-6 pt-6">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Position Audit History</h5>
                <div className="divide-y divide-hairline border-t border-hairline">
                  {returns.map(r => (
                    <div key={r.id} className="py-5 flex items-center justify-between group hover:bg-surface-soft/30 transition-colors px-4 -mx-4 rounded-lg">
                      <div className="flex items-center gap-6">
                        <div className="p-2.5 bg-semantic-up/5 border border-semantic-up/10 rounded-full">
                          <ArrowUpRight className="w-5 h-5 text-semantic-up" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink tracking-tight">{format(new Date(r.date), 'dd MMMM yyyy')}</p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{r.percentage}% Institutional Return</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-semantic-up financial-number">{currency}{r.amount.toLocaleString()}</p>
                    </div>
                  ))}
                  {returns.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted italic font-medium">No yield entries recorded for this position.</p>
                  )}
                </div>
              </div>
            </div>
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
