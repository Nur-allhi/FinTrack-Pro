import React, { useState } from 'react';
import { Investment, InvestmentReturn } from '../types';
import { Plus, TrendingUp, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { authService } from '../services/authService';

interface InvestmentDetailProps {
  investment: Investment;
  returns: InvestmentReturn[];
  currency: string;
  onAddReturn: () => void;
  onRefresh: () => void;
}

export default function InvestmentDetail({ investment, returns, currency, onAddReturn, onRefresh }: InvestmentDetailProps) {
  const [isAddingReturn, setIsAddingReturn] = useState(false);
  const [newReturn, setNewReturn] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    percentage: ''
  });

  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  const chartData = [...returns].reverse().map(r => ({
    date: format(new Date(r.date), 'MMM yy'),
    amount: r.amount,
    percentage: r.percentage
  }));

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.apiFetch(`/api/investments/${investment.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReturn,
          amount: parseFloat(newReturn.amount),
          percentage: parseFloat(newReturn.percentage)
        })
      });
      setIsAddingReturn(false);
      setNewReturn({ date: format(new Date(), 'yyyy-MM-dd'), amount: '', percentage: '' });
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="card-xl space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-3xl font-normal text-ink tracking-tight">{investment.account_name}</h4>
          <p className="text-sm text-muted font-medium mt-1">Institutional Principal: <span className="financial-number text-ink">{currency}{investment.principal.toLocaleString()}</span></p>
        </div>
        <button onClick={() => setIsAddingReturn(true)} className="btn-pill">
          <Plus className="w-4 h-4" />
          Audit Yield
        </button>
      </div>

      <AnimatePresence>
        {isAddingReturn && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-8 bg-semantic-up/5 rounded-xl border border-semantic-up/10 shadow-sm shadow-semantic-up/5">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-sm font-bold text-semantic-up uppercase tracking-widest">Log Institutional Yield</h5>
                <button onClick={() => setIsAddingReturn(false)} className="p-1 text-semantic-up/40 hover:text-semantic-up">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddReturn} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-semantic-up/60 uppercase tracking-widest">Value Date</label>
                  <DatePicker value={newReturn.date} onChange={v => setNewReturn({...newReturn, date: v})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-semantic-up/60 uppercase tracking-widest">Return ({currency})</label>
                  <input type="number" required value={newReturn.amount} onChange={e => setNewReturn({...newReturn, amount: e.target.value})} className="w-full px-4 py-2.5 bg-canvas border border-semantic-up/20 text-ink rounded-md outline-none text-sm financial-number" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-semantic-up/60 uppercase tracking-widest">Yield %</label>
                  <input type="number" step="0.01" required value={newReturn.percentage} onChange={e => setNewReturn({...newReturn, percentage: e.target.value})} className="w-full px-4 py-2.5 bg-canvas border border-semantic-up/20 text-ink rounded-md outline-none text-sm financial-number" />
                </div>
                <div className="md:col-span-3 flex justify-end gap-4 pt-2">
                  <button type="submit" className="btn-primary h-[48px] px-10 bg-semantic-up hover:bg-semantic-up/90 border-none">Save Yield Entry</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-surface-soft rounded-xl border border-hairline">
          <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Cumulative Yield</p>
          <p className="text-xl font-bold text-semantic-up financial-number mt-1">{currency}{totalReturns.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-surface-soft rounded-xl border border-hairline">
          <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Portfolio ROI</p>
          <p className="text-xl font-bold text-primary financial-number mt-1">{((totalReturns / investment.principal) * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="h-64 w-full p-5 bg-canvas border border-hairline rounded-xl relative overflow-hidden">
        <div className="absolute top-5 left-5">
          <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Yield Velocity</p>
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
        <h5 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Position Audit History</h5>
        <div className="divide-y divide-hairline border-t border-hairline">
          {returns.map(r => (
            <div key={r.id} className="py-5 flex items-center justify-between group hover:bg-surface-soft/30 transition-colors px-4 -mx-4 rounded-lg">
              <div className="flex items-center gap-6">
                <div className="p-2.5 bg-semantic-up/5 border border-semantic-up/10 rounded-full">
                  <ArrowUpRight className="w-5 h-5 text-semantic-up" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink tracking-tight">{format(new Date(r.date), 'dd MMMM yyyy')}</p>
                  <p className="text-xs font-bold text-muted uppercase tracking-widest">{r.percentage}% Institutional Return</p>
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
  );
}
