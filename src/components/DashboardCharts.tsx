import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { Transaction, Account } from '../types';

interface DashboardChartsProps {
  accounts: Account[];
  currency: string;
}

const CATEGORY_COLORS = [
  '#0052FF', '#00C853', '#FF6D00', '#AA00FF', '#FF1744',
  '#00BFA5', '#FFD600', '#6200EA', '#00B0FF', '#F50057',
];

export default function DashboardCharts({ accounts, currency }: DashboardChartsProps) {
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [accounts]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const activeAccounts = accounts.filter(a => !a.archived && a.id);
      if (activeAccounts.length === 0) { setLoading(false); return; }

      const allTransactions: Transaction[] = [];
      const results = await Promise.all(
        activeAccounts.map(a => authService.apiFetch(`/api/transactions/${a.id}`).then(r => r.json()))
      );
      results.forEach(r => { if (Array.isArray(r)) allTransactions.push(...r); });

      const spending: Record<string, number> = {};
      allTransactions
        .filter(t => t.amount < 0)
        .forEach(t => {
          const cat = t.category || 'Other';
          spending[cat] = (spending[cat] || 0) + Math.abs(t.amount);
        });
      const pieData = Object.entries(spending)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      setCategoryData(pieData);

      const dateBalances: Record<string, number> = {};
      const sorted = [...allTransactions].sort((a, b) => a.date.localeCompare(b.date));
      let running = activeAccounts.reduce((s, a) => s + (a.initial_balance || 0), 0);
      sorted.forEach(t => {
        running += t.amount;
        dateBalances[t.date] = running;
      });
      const trend = Object.entries(dateBalances)
        .map(([date, balance]) => ({ date, balance }))
        .slice(-30);
      setTrendData(trend);
    } catch { /* silent */ }
    setLoading(false);
  };

  if (loading || (categoryData.length === 0 && trendData.length === 0)) return null;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-canvas border border-hairline rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-ink">{payload[0].name}</p>
        <p className="text-xs text-muted financial-number">{currency}{payload[0].value.toLocaleString()}</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {categoryData.length > 0 && (
        <div className="bg-canvas border border-hairline rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Spending by Category</h4>
          </div>
          <div className="h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {categoryData.slice(0, 5).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                <span className="text-[10px] font-semibold text-muted truncate max-w-[80px]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {trendData.length > 1 && (
        <div className="bg-canvas border border-hairline rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Balance Trend</h4>
          </div>
          <div className="h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052FF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${currency}${(v / 1000).toFixed(0)}k`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#0052FF" strokeWidth={2} fill="url(#balanceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
