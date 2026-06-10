import React, { useState, useMemo } from 'react';
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
  User,
} from 'lucide-react';
import DashboardHero from './DashboardHero';
import DashboardCharts from './DashboardCharts';

interface DashboardProps {
  accounts: Account[];
  members: Member[];
  filterMemberId: number | 'all' | 'general';
  setFilterMemberId: (id: number | 'all' | 'general') => void;
  onSelectAccount: (id: number) => void;
  onWriteOperation: (op: { type: 'transaction' | 'transfer' | 'loan_create' | 'investment_create' }) => void;
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
  onWriteOperation, onGenerateReport, settings, userName, dataLoading
}: DashboardProps & { userName?: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'cash' | 'mobile' | 'investment' | 'other'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const typeFilters: { key: typeof filterType; label: string; icon: React.ComponentType<{ className?: string }> | null }[] = useMemo(() => [
    { key: 'all', label: 'All', icon: null },
    { key: 'bank', label: 'Banks', icon: Building2 },
    { key: 'cash', label: 'Cash', icon: Wallet },
    { key: 'mobile', label: 'Mobile', icon: Smartphone },
    { key: 'investment', label: 'Investments', icon: TrendingUp },
    { key: 'other', label: 'Others', icon: null },
  ], []);

  const activeAccounts = useMemo(() => accounts.filter(a => !a.archived), [accounts]);

  const filteredAccounts = useMemo(() => activeAccounts
    .filter(acc => {
      if (filterType !== 'all') {
        if (filterType === 'other') {
          if (['bank', 'cash', 'mobile', 'investment'].includes(acc.type)) return false;
        } else if (acc.type !== filterType) return false;
      }
      if (filterMemberId === 'all') return true;
      if (filterMemberId === 'general') return !acc.member_id;
      return acc.member_id == filterMemberId;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
  , [activeAccounts, filterType, filterMemberId]);

  const groupFilteredAccounts = useMemo(() => activeAccounts.filter(acc => {
    if (filterType !== 'all') {
      if (filterType === 'other') {
        if (['bank', 'cash', 'mobile', 'investment'].includes(acc.type)) return false;
      } else if (acc.type !== filterType) return false;
    }
    return true;
  }), [activeAccounts, filterType]);

  const { groupedByMember, unassignedAccounts } = useMemo(() => {
    const grouped = members
      .map(member => ({
        member,
        accounts: groupFilteredAccounts
          .filter(a => a.member_id == member.id)
          .sort((a, b) => a.name.localeCompare(b.name))
      }))
      .filter(g => g.accounts.length > 0)
      .sort((a, b) => a.member.name.localeCompare(b.member.name));
    const unassigned = groupFilteredAccounts
      .filter(a => !a.member_id)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { groupedByMember: grouped, unassignedAccounts: unassigned };
  }, [members, groupFilteredAccounts]);

  const totalBalance = useMemo(() => activeAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0), [activeAccounts]);
  const totalLiabilities = useMemo(() => activeAccounts
    .filter(a => (a.current_balance || 0) < 0)
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0), [activeAccounts]);

  const showHero = settings.showNetWorth || settings.showCurrentAssets || settings.showLiabilities || settings.showTodos;

  return (
    <div className={showHero ? "space-y-8" : ""}>
      <DashboardHero
        totalBalance={totalBalance}
        currency={settings.currency}
        showNetWorth={settings.showNetWorth}
        showCurrentAssets={settings.showCurrentAssets}
        showLiabilities={settings.showLiabilities}
        showTodos={settings.showTodos}
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
            <button onClick={() => onWriteOperation({ type: 'transaction' })} className="btn-primary px-5 py-2.5 text-xs md:text-sm">
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
            <button onClick={() => onWriteOperation({ type: 'transfer' })} className="btn-pill bg-canvas text-ink border border-hairline px-5 py-2.5 text-xs md:text-sm hover:bg-surface-soft transition-colors">
              <ArrowLeftRight className="w-4 h-4" />
              Inter-Account Transfer
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-3 py-1.5 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
                showFilters || filterType !== 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft border border-hairline text-muted'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <div className="flex items-center bg-surface-soft border border-hairline p-0.5 rounded-pill relative shadow-sm">
              <motion.div
                className="absolute inset-y-0.5 rounded-pill bg-white/70 shadow-sm dark:bg-white/10 z-0"
                animate={{
                  left: viewMode === 'grid' ? '2px' : '50%',
                  right: viewMode === 'list' ? '2px' : '50%',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
              <button onClick={() => setViewMode('grid')} className={cn("relative z-10 flex-1 px-3 md:px-4 py-1 rounded-pill text-xs font-bold text-center transition-colors", viewMode === 'grid' ? "text-ink" : "text-muted hover:text-ink")}>Grid</button>
              <button onClick={() => setViewMode('list')} className={cn("relative z-10 flex-1 px-3 md:px-4 py-1 rounded-pill text-xs font-bold text-center transition-colors", viewMode === 'list' ? "text-ink" : "text-muted hover:text-ink")}>List</button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ willChange: 'transform, opacity' }}
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
                        style={filterType === f.key ? { backgroundColor: typeColor || 'var(--color-primary)' } : {}}
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

        <motion.div key={String(filterMemberId) + '-' + viewMode + '-' + filterType} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} style={{ willChange: 'transform, opacity' }} className="space-y-4 md:space-y-6">
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
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted shrink-0" />
                            <span className="text-xs font-medium text-muted">{account.member_name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{settings.currency}{account.current_balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2">
                {filteredAccounts.map(account => (
                  <button key={account.id} onClick={() => onSelectAccount(account.id)} className="w-full bg-canvas p-3 rounded-xl border border-hairline flex items-start gap-3 text-left transition-all hover:border-primary">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: account.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-semibold text-ink truncate block">{account.name}</span>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                          <User className="w-3 h-3 shrink-0" />
                          {account.member_name || 'General'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-ink financial-number shrink-0 self-start">{settings.currency}{account.current_balance.toLocaleString()}</span>
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
