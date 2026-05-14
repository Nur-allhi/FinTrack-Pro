import React, { useState } from 'react';
import { Account, Member } from '../types';
import { cn } from '../utils/cn';
import { 
  Wallet, 
  Building2, 
  Smartphone, 
  TrendingUp, 
  Target, 
  Home,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Users
} from 'lucide-react';

interface DashboardProps {
  accounts: Account[];
  members: Member[];
  filterMemberId: number | 'all' | 'general';
  setFilterMemberId: (id: number | 'all' | 'general') => void;
  onSelectAccount: (id: number) => void;
  onOpenTransfer: () => void;
  onGenerateReport: () => void;
  settings: {
    showNetWorth: boolean;
    showCurrentAssets: boolean;
    showLiabilities: boolean;
    darkMode: boolean;
    fontSize: string;
    currency: string;
    typeColors?: Record<string, string>;
  };
}

const typeIcons: Record<string, any> = {
  cash: Wallet,
  bank: Building2,
  mobile: Smartphone,
  investment: TrendingUp,
  purpose: Target,
  home_exp: Home,
};

export default function Dashboard({ 
  accounts, 
  members, 
  filterMemberId, 
  setFilterMemberId, 
  onSelectAccount, 
  onOpenTransfer,
  onGenerateReport,
  settings
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'cash' | 'mobile' | 'investment' | 'other'>('all');
  const activeAccounts = accounts.filter(a => !a.archived);

  const typeFilters: { key: typeof filterType; label: string; icon: any }[] = [
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

  return (
    <div className="space-y-8">
      {/* Hero / Summary Section */}
      {(settings.showNetWorth || settings.showCurrentAssets || settings.showLiabilities) && (
        <div className="bg-primary/5 p-6 md:p-12 lg:p-16 rounded-xl relative overflow-hidden border border-primary/10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-[64px] md:blur-[128px] -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center">
            <div>
              <p className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.3em] mb-2 md:mb-4">Total Balance</p>
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-normal text-ink tracking-[-0.03em] financial-number mb-4 md:mb-8">
                {settings.currency}{totalBalance.toLocaleString()}
              </h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={onOpenTransfer} className="btn-primary text-xs md:text-sm px-5 md:px-8 py-2.5 md:py-3">Transfer Funds</button>
                <button onClick={onGenerateReport} className="btn-pill bg-canvas text-ink border border-hairline px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm hover:bg-surface-soft transition-colors">Generate Report</button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {settings.showCurrentAssets && (
                <div className="bg-canvas p-3 md:p-5 rounded-xl border border-hairline">
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Assets</p>
                  <p className="text-base md:text-xl font-normal text-ink financial-number tracking-tighter mt-0.5 md:mt-1">
                    {settings.currency}{totalBalance.toLocaleString()}
                  </p>
                </div>
              )}
              {settings.showLiabilities && (
                <div className="bg-canvas p-3 md:p-5 rounded-xl border border-hairline">
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Liabilities</p>
                  <p className="text-base md:text-xl font-normal text-ink financial-number tracking-tighter mt-0.5 md:mt-1">
                    {settings.currency}0
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accounts List Section */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base md:text-lg font-normal text-ink tracking-tight">Your Portfolio</h4>
          <div className="flex items-center gap-2 bg-surface-soft p-0.5 rounded-pill border border-hairline">
            <button onClick={() => setViewMode('grid')} className={cn("px-3 md:px-4 py-1 rounded-pill text-[10px] md:text-xs font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
            <button onClick={() => setViewMode('list')} className={cn("px-3 md:px-4 py-1 rounded-pill text-[10px] md:text-xs font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {typeFilters.map(f => {
            const Icon = f.icon;
            const typeColor = settings.typeColors?.[f.key];
            return (
              <button key={f.key} onClick={() => setFilterType(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[10px] md:text-xs font-bold transition-all",
                  filterType === f.key
                    ? "text-white shadow-sm"
                    : "bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink"
                )}
                style={filterType === f.key && typeColor ? { backgroundColor: typeColor } : {}}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 md:space-y-6">
          {viewMode === 'grid' ? (
            filterMemberId === 'all' ? (
              <>
                {groupedByMember.map(({ member, accounts }) => (
                  <div key={member.id} className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{member.name}'s Assets</span>
                      <div className="flex-1 h-px bg-hairline" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                      {accounts.map(account => (
                        <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} currency={settings.currency} typeColors={settings.typeColors} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {filteredAccounts.map(account => (
                  <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} currency={settings.currency} typeColors={settings.typeColors} />
                ))}
              </div>
            )
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em] border-b border-hairline">
                      <th className="px-5 py-3 whitespace-nowrap">Account</th>
                      <th className="px-5 py-3 whitespace-nowrap">Type</th>
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
                            <span className="text-sm font-semibold text-ink">{account.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted">{account.member_name || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{settings.currency}{account.current_balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile compact cards */}
              <div className="md:hidden space-y-2">
                {filteredAccounts.map(account => (
                  <button key={account.id} onClick={() => onSelectAccount(account.id)} className="w-full bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3 text-left transition-all hover:border-primary">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink truncate">{account.name}</span>
                        <span className="text-sm font-bold text-ink financial-number shrink-0">{settings.currency}{account.current_balance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</span>
                        <span className="text-muted/40">·</span>
                        <span className="text-[10px] font-medium text-muted">{account.member_name || 'General'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account, onClick, currency, typeColors }: { account: Account, onClick: () => void, currency: string, typeColors?: Record<string, string>, key?: React.Key }) {
  const Icon = typeIcons[account.type] || Wallet;
  const typeColor = typeColors?.[account.type] || '#0052FF';
  
  return (
    <button 
      onClick={onClick}
      className="card-xl group hover:border-primary transition-all text-left flex flex-col gap-2 md:gap-3"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: typeColor }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 md:gap-2">
            <h5 className="text-sm md:text-base font-semibold text-ink truncate">{account.name}</h5>
            <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">{account.type.replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted truncate">{account.member_name || 'General'}</p>
        </div>
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-xl md:text-2xl font-normal text-ink financial-number tracking-tighter">
          {currency}{account.current_balance.toLocaleString()}
        </p>
        <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-wider">SETTLED</span>
      </div>
    </button>
  );
}
