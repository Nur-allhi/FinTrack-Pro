import React from 'react';
import { Loader2 } from 'lucide-react';
import DashboardTodos from './DashboardTodos';

interface DashboardHeroProps {
  totalBalance: number;
  currency: string;
  showNetWorth: boolean;
  showCurrentAssets: boolean;
  showLiabilities: boolean;
  showTodos?: boolean;
  userName?: string;
  dataLoading?: boolean;
  accountsLength: number;
  totalLiabilities?: number;
}

export default function DashboardHero({
  totalBalance, currency, showNetWorth, showCurrentAssets, showLiabilities, showTodos = true,
  userName, dataLoading, accountsLength, totalLiabilities = 0,
}: DashboardHeroProps) {
  if (!showNetWorth && !showCurrentAssets && !showLiabilities && !showTodos) return null;

  return (
    <div className="bg-primary/5 p-6 md:p-12 lg:p-16 rounded-xl relative overflow-hidden border border-primary/10">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-[64px] md:blur-[128px] -translate-y-1/2 translate-x-1/2" />
      </div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
        <div className="space-y-4 md:space-y-6">
          <div>
            {userName && <p className="text-sm font-semibold text-ink mb-1 md:mb-2">Welcome back, {userName}</p>}
            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-2 md:mb-4">Total Balance</p>
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-normal text-ink tracking-[-0.03em] financial-number">
              {currency}{totalBalance.toLocaleString()}
            </h3>
          </div>
          {dataLoading && accountsLength === 0 && (
            <div className="flex items-center gap-2 text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs font-semibold">Loading your data...</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {showCurrentAssets && (
              <div className="bg-canvas p-3 md:p-5 rounded-xl border border-hairline">
                <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Assets</p>
                <p className="text-base md:text-xl font-normal text-ink financial-number tracking-tighter mt-0.5 md:mt-1">
                  {currency}{totalBalance.toLocaleString()}
                </p>
              </div>
            )}
            {showLiabilities && (
              <div className="bg-canvas p-3 md:p-5 rounded-xl border border-hairline">
                <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Liabilities</p>
                <p className="text-base md:text-xl font-normal text-ink financial-number tracking-tighter mt-0.5 md:mt-1">
                  {currency}{totalLiabilities.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {showTodos && <DashboardTodos />}
      </div>
    </div>
  );
}
