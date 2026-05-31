import React, { useState } from 'react';
import { Account, Member } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import AccountCard from './AccountCard';
import Select from './Select';
import {
  Building2,
  Wallet,
  Smartphone,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import DashboardHero from './DashboardHero';
import DashboardCharts from './DashboardCharts';

interface DashboardProps {
  accounts: Account[];
  members: Member[];
  filterMemberId: number | 'all' | 'general';
  setFilterMemberId: (id: number | 'all' | 'general') => void;
  onSelectAccount: (id: number) => void;
  onOpenTransfer: () => void;
  onOpenTransaction: () => void;
  onGenerateReport: () => void;
  settings: {
    showNetWorth: boolean;
    showCurrentAssets: boolean;
    showLiabilities: boolean;
    showTodos?: boolean;
    showSpendingChart?: boolean;
    showBalanceTrend?: boolean;
    darkMode: boolean;
    fontSize: string;
    currency: string;
    typeColors?: Record<string, string>;
  };
  dataLoading?: boolean;
}

export default function Dashboard({ 
  accounts, members, filterMemberId, setFilterMemberId, onSelectAccount, 
  onOpenTransfer, onOpenTransaction, onGenerateReport, settings, userName, dataLoading
}: DashboardProps & { userName?: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'cash' | 'mobile' | 'investment' | 'other'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const activeAccounts = accounts.filter(a => !a.archived);

  const typeFilters: { key: typeof filterType; label: string; icon: React.ComponentType<{ className?: string }> | null }[] = [
    { key: 'all', label: 'All', icon: null },
    { key: 'bank', label: 'Banks', icon: Building2 },
    { key: 'cash', label: 'Cash', icon: Wallet },
    { key: 'mobile', label: 'Mobile', icon: Smartphone },
    { key: 'investment', label: 'Investments', icon: TrendingUp },
    { key: 'other', label: 'Others', icon: null },
  ];
  
  const filteredAccounts = activeAccounts.filter(acc => {
    if (filterType !== 'all') {
      if (filterType === 'other') {
        if (['bank', 'cash', 'mobile', 'investment'].includes(acc.type)) return false;
      } else if (acc.type !== filterType) return false;
    }
    if (filterMemberId === 'all') return true;
    if (filterMemberId === 'general') return !acc.member_id;
    return acc.member_id === filterMemberId;
  });

  const groupFilteredAccounts = activeAccounts.filter(acc => {
    if (filterType !== 'all') {
      if (filterType === 'other') {
        if (['bank', 'cash', 'mobile', 'investment'].includes(acc.type)) return false;
      } else if (acc.type !== filterType) return false;
    }
    return true;
  });

  const groupedByMember = members.map(member => ({
    member,
    accounts: groupFilteredAccounts.filter(a => a.member_id === member.id)
  })).filter(g => g.accounts.length > 0);

  const unassignedAccounts = groupFilteredAccounts.filter(a => !a.member_id);

  const totalBalance = activeAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const totalLiabilities = activeAccounts
    .filter(a => (a.current_balance || 0) < 0)
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0);

  return (
    <div className="space-y-8">
      <DashboardHero
        totalBalance={totalBalance}
        currency={settings.currency}
        showNetWorth={settings.showNetWorth}
        showCurrentAssets={settings.showCurrentAssets}
        showLiabilities={settings.showLiabilities}
        userName={userName}
        dataLoading={dataLoading}
        accountsLength={accounts.length}
        totalLiabilities={totalLiabilities}
      />

      <DashboardCharts accounts={accounts} currency={settings.currency} showSpendingChart={settings.showSpendingChart} showBalanceTrend={settings.showBalanceTrend} />

      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="w-auto md:w-44 shrink-0 min-w-0">
            <Select
              value={String(filterMemberId)}
              onChange={v => setFilterMemberId(v === 'all' ? 'all' : v === 'general' ? 'general' : Number(v))}
              options={[
                { value: 'all', label: 'All Members' },
                { value: 'general', label: 'General' },
                ...members.map(m => ({ value: String(m.id), label: m.name }))
              ]}
            />
          </div>
          <div className="hidden md:flex items-center justify-center gap-2 flex-1 flex-wrap">
            <button onClick={onOpenTransaction} className="btn-primary px-5 py-2.5 text-xs md:text-sm">
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
            <button onClick={onOpenTransfer} className="btn-pill bg-canvas text-ink border border-hairline px-5 py-2.5 text-xs md:text-sm hover:bg-surface-soft transition-colors">
              <ArrowLeftRight className="w-4 h-4" />
              Inter-Account Transfer
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-3 py-1.5 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
                showFilters || filterType !== 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <div className="flex items-center gap-2 bg-surface-soft p-0.5 rounded-pill border border-hairline">
              <button onClick={() => setViewMode('grid')} className={cn("px-3 md:px-4 py-1 rounded-pill text-xs font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
              <button onClick={() => setViewMode('list')} className={cn("px-3 md:px-4 py-1 rounded-pill text-xs font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-canvas rounded-xl border border-hairline p-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {typeFilters.map(f => {
                    const Icon = f.icon;
                    const typeColor = settings.typeColors?.[f.key];
                    return (
                      <button key={f.key} onClick={() => setFilterType(f.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold transition-all",
                          filterType === f.key
                            ? "text-white shadow-sm"
                            : "bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink"
                        )}
                        style={filterType === f.key ? { backgroundColor: typeColor || '#0052FF' } : {}}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div key={String(filterMemberId) + '-' + viewMode + '-' + filterType} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4 md:space-y-6">
          {viewMode === 'grid' ? (
            filterMemberId === 'all' ? (
              <>
                {groupedByMember.map(({ member, accounts }) => (
                  <div key={member.id} className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-xs font-bold text-muted uppercase tracking-[0.2em]">{member.name}'s Assets</span>
                      <div className="flex-1 h-px bg-hairline" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                      {accounts.map(account => (
                        <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} currency={settings.currency} typeColors={settings.typeColors} filterMemberId={filterMemberId} />
                      ))}
                    </div>
                  </div>
                ))}
                {unassignedAccounts.length > 0 && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-xs font-bold text-muted uppercase tracking-[0.2em]">General Accounts</span>
                      <div className="flex-1 h-px bg-hairline" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                      {unassignedAccounts.map(account => (
                        <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} currency={settings.currency} typeColors={settings.typeColors} filterMemberId={filterMemberId} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {filteredAccounts.map(account => (
                  <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} currency={settings.currency} typeColors={settings.typeColors} filterMemberId={filterMemberId} />
                ))}
              </div>
            )
          ) : (
            <>
              <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
                      <th className="px-5 py-3 whitespace-nowrap">Account</th>
                      <th className="px-5 py-3 whitespace-nowrap">Type</th>
                      <th className="px-5 py-3 whitespace-nowrap">Group</th>
                      <th className="px-5 py-3 whitespace-nowrap">Member</th>
                      <th className="px-5 py-3 whitespace-nowrap text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredAccounts.map(account => (
                      <tr key={account.id} onClick={() => onSelectAccount(account.id)} className="hover:bg-surface-soft/30 transition-colors cursor-pointer">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                            <span className="text-base font-semibold text-ink">{account.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted">{account.parent_name || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted">{account.member_name || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{settings.currency}{account.current_balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2">
                {filteredAccounts.map(account => (
                  <button key={account.id} onClick={() => onSelectAccount(account.id)} className="w-full bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3 text-left transition-all hover:border-primary">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-semibold text-ink truncate">{account.name}</span>
                        <span className="text-sm font-bold text-ink financial-number shrink-0">{settings.currency}{account.current_balance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</span>
                        <span className="text-muted/40">·</span>
                        <span className="text-xs font-medium text-muted">{account.member_name || 'General'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
