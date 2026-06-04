import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { localDb } from '../services/localDb';
import { Account } from '../types';

interface DashboardChartsProps {
  accounts: Account[];
  currency: string;
  showSpendingChart?: boolean;
  showBalanceTrend?: boolean;
}

const CATEGORY_COLORS = [
  '#A78BFA', '#00C853', '#FF6D00', '#AA00FF', '#FF1744',
  '#00BFA5', '#FFD600', '#6200EA', '#00B0FF', '#F50057',
];

export default function DashboardCharts({ accounts, currency, showSpendingChart = true, showBalanceTrend = true }: DashboardChartsProps) {
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      const activeAccounts = accounts.filter(a => !a.archived && a.id);
      if (activeAccounts.length === 0) { setLoading(false); return; }

      const localAccounts = await localDb.getAccounts();
      const localIdByServerId = new Map<number, string>();
      for (const la of localAccounts) {
        if (la.server_id != null) localIdByServerId.set(la.server_id, la.id);
      }
      const activeLocalIds = new Set<string>();
      for (const a of activeAccounts) {
        const lid = localIdByServerId.get(a.id);
        if (lid) activeLocalIds.add(lid);
      }

      const allLocal = await localDb.getTransactions();
      const transactions = allLocal
        .filter(t => activeLocalIds.has(t.account_id))
        .map(t => ({
          date: t.date,
          amount: t.amount,
          category: t.category,
        }));

      if (showSpendingChart) {
        const spending: Record<string, number> = {};
        transactions
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
      }

      if (showBalanceTrend) {
        const dateBalances: Record<string, number> = {};
        const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
        let running = activeAccounts.reduce((s, a) => s + (a.initial_balance || 0), 0);
        sorted.forEach(t => {
          running += t.amount;
          dateBalances[t.date] = running;
        });
        const trend = Object.entries(dateBalances)
          .map(([date, balance]) => ({ date, balance }))
          .slice(-30);
        setTrendData(trend);
      }
    } catch (e) {
      console.error('DashboardCharts load failed:', e);
    }
    setLoading(false);
  }, [accounts, showSpendingChart, showBalanceTrend]);

  useEffect(() => {
    if (!showSpendingChart && !showBalanceTrend) { setLoading(false); return; }
    loadChartData();
  }, [loadChartData, showSpendingChart, showBalanceTrend]);

  useEffect(() => {
    const unsub = localDb.onChange('transactions', () => {
      loadChartData();
    });
    return unsub;
  }, [loadChartData]);

  const bothDisabled = !showSpendingChart && !showBalanceTrend;
  const noData = !loading && categoryData.length === 0 && trendData.length === 0;
  if (bothDisabled || noData) return null;

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
      {showSpendingChart && (loading || categoryData.length > 0) && (
        <div className="bg-canvas border border-hairline rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Spending by Category</h4>
          </div>
          <div className="h-48 md:h-56">
            {!loading && categoryData.length > 0 && (
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
            )}
          </div>
          {!loading && categoryData.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {categoryData.slice(0, 5).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-[10px] font-semibold text-muted truncate max-w-[80px]">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBalanceTrend && (loading || trendData.length > 1) && (
        <div className="bg-canvas border border-hairline rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Balance Trend</h4>
          </div>
          <div className="h-48 md:h-56">
            {!loading && trendData.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${currency}${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} fill="url(#balanceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
