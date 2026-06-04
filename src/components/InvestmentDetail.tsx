import React, { useState } from 'react';
import { Investment, InvestmentReturn, WriteOperation } from '../types';
import { Plus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface InvestmentDetailProps {
  investment: Investment;
  returns: InvestmentReturn[];
  currency: string;
  onWriteOperation: (op: WriteOperation) => void;
}

export default function InvestmentDetail({ investment, returns, currency, onWriteOperation }: InvestmentDetailProps) {
  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  const chartData = [...returns].reverse().map(r => ({
    date: format(new Date(r.date), 'MMM yy'),
    amount: r.amount,
    percentage: r.percentage
  }));

  return (
    <div className="card-xl space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-3xl font-normal text-ink tracking-tight">{investment.account_name}</h4>
          <p className="text-sm text-muted font-medium mt-1">Institutional Principal: <span className="financial-number text-ink">{currency}{investment.principal.toLocaleString()}</span></p>
        </div>
        <button onClick={() => onWriteOperation({ type: 'investment_return', investment })} className="btn-pill">
          <Plus className="w-4 h-4" />
          Audit Yield
        </button>
      </div>

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
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted)', fontSize: 10, fontWeight: 'bold'}} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-canvas)', borderRadius: '12px', border: '1px solid var(--color-hairline)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
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
