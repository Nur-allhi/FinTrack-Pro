import React, { useState, useEffect } from 'react';
import { Account, Investment, InvestmentReturn } from '../types';
import { Plus, TrendingUp, Calendar, DollarSign, Percent, ArrowUpRight, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
    const res = await fetch('/api/investments');
    setInvestments(await res.json());
  };

  const fetchReturns = async (id: number) => {
    const res = await fetch(`/api/investments/${id}/returns`);
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
      await fetch('/api/investments', {
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
      await fetch(`/api/investments/${selectedInv.id}/returns`, {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Investment Performance</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Investment
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-primary/20 dark:border-primary/30 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Track New Investment</h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleCreateInv} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source Account</label>
              <select 
                required
                value={newInv.account_id}
                onChange={e => setNewInv({...newInv, account_id: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Select Account</option>
                {accounts.filter(a => a.type === 'investment').map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Principal Amount</label>
              <input 
                type="number" 
                required
                value={newInv.principal}
                onChange={e => setNewInv({...newInv, principal: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investment Date</label>
              <input 
                type="date" 
                required
                value={newInv.date}
                onChange={e => setNewInv({...newInv, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Start Tracking</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Investment List */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Investments</h4>
          <div className="space-y-3">
            {investments.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInv(inv)}
                className={`w-full p-5 rounded-3xl border transition-all text-left group ${selectedInv?.id === inv.id ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/30 shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className={`w-5 h-5 ${selectedInv?.id === inv.id ? 'text-white/80' : 'text-primary'}`} />
                  <ChevronRight className={`w-5 h-5 ${selectedInv?.id === inv.id ? 'text-white/60' : 'text-slate-300 dark:text-slate-600'}`} />
                </div>
                <h5 className={`font-bold truncate ${selectedInv?.id === inv.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{inv.account_name}</h5>
                <p className={`text-xs font-medium mb-3 ${selectedInv?.id === inv.id ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>Started {format(new Date(inv.date), 'MMM yyyy')}</p>
                <p className={`text-lg font-bold financial-number ${selectedInv?.id === inv.id ? 'text-white' : 'text-primary'}`}>{currency}{inv.principal.toLocaleString()}</p>
              </button>
            ))}
            {investments.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-medium">
                No investments tracked yet.
              </div>
            )}
          </div>
        </div>

        {/* Performance Detail */}
        <div className="lg:col-span-2">
          {selectedInv ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedInv.account_name}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Principal: <span className="financial-number">{currency}{selectedInv.principal.toLocaleString()}</span></p>
                </div>
                <button 
                  onClick={() => setIsAddingReturn(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Log Return
                </button>
              </div>

              {isAddingReturn && (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                  <form onSubmit={handleAddReturn} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Date</label>
                      <input type="date" required value={newReturn.date} onChange={e => setNewReturn({...newReturn, date: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 rounded-lg outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Amount ({currency})</label>
                      <input type="number" required value={newReturn.amount} onChange={e => setNewReturn({...newReturn, amount: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 rounded-lg outline-none financial-number" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Return %</label>
                      <input type="number" step="0.01" required value={newReturn.percentage} onChange={e => setNewReturn({...newReturn, percentage: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 rounded-lg outline-none financial-number" />
                    </div>
                    <div className="flex items-end gap-2">
                      <button type="submit" className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-all">Save</button>
                      <button type="button" onClick={() => setIsAddingReturn(false)} className="p-2 text-emerald-400 hover:text-emerald-600"><X className="w-5 h-5" /></button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Returns</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 financial-number">{currency}{totalReturns.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cumulative ROI</p>
                  <p className="text-2xl font-bold text-primary dark:text-blue-400 financial-number">{((totalReturns / selectedInv.principal) * 100).toFixed(2)}%</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A5FCC" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1A5FCC" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1A5FCC', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#1A5FCC" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Return History</h5>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {returns.map(r => (
                    <div key={r.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                          <ArrowUpRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{format(new Date(r.date), 'dd MMM yyyy')}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{r.percentage}% Return</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 financial-number">{currency}{r.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full">
                <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">Select an Investment</h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Click on an investment from the list to view detailed performance metrics and return history.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
