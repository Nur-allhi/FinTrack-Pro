import React, { useState } from 'react';
import { Account, Member } from '../types';
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
  onSelectAccount: (id: number) => void;
  onOpenTransfer: () => void;
}

const typeIcons: Record<string, any> = {
  cash: Wallet,
  bank: Building2,
  mobile: Smartphone,
  investment: TrendingUp,
  purpose: Target,
  home_exp: Home,
};

export default function Dashboard({ accounts, members, onSelectAccount, onOpenTransfer }: DashboardProps) {
  const [filterMemberId, setFilterMemberId] = useState<number | 'all' | 'general'>('all');
  
  const activeAccounts = accounts.filter(a => !a.archived);
  
  const filteredAccounts = activeAccounts.filter(acc => {
    if (filterMemberId === 'all') return true;
    if (filterMemberId === 'general') return !acc.member_id;
    return acc.member_id === filterMemberId;
  });

  const groupedByMember = members.map(member => ({
    member,
    accounts: activeAccounts.filter(a => a.member_id === member.id)
  })).filter(g => g.accounts.length > 0);

  const unassignedAccounts = activeAccounts.filter(a => !a.member_id);

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return (
    <div className="space-y-8">
      {/* Dashboard Customizer / Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Dashboard View</h3>
            <p className="text-xs text-slate-500">Customize what you see</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMemberId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterMemberId === 'all' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            COMBINED
          </button>
          <button
            onClick={() => setFilterMemberId('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterMemberId === 'general' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            GENERAL
          </button>
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => setFilterMemberId(member.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterMemberId === member.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {member.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Wallet className="text-primary w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+2.4%</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            {filterMemberId === 'all' ? 'Total Net Worth' : 'Member Net Worth'}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 financial-number">৳{totalBalance.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <ArrowUpRight className="text-emerald-600 w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Current Assets</p>
          <h3 className="text-2xl font-bold text-slate-900 financial-number">৳{totalBalance.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-100 rounded-2xl">
              <ArrowDownRight className="text-rose-600 w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Liabilities</p>
          <h3 className="text-2xl font-bold text-slate-900 financial-number">৳0</h3>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-6">
        {filterMemberId === 'all' ? (
          <>
            {groupedByMember.map(({ member, accounts }) => (
              <div key={member.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h4 className="text-lg font-bold text-slate-800">{member.name}'s Accounts</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map(account => (
                    <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} />
                  ))}
                </div>
              </div>
            ))}

            {unassignedAccounts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-slate-400 rounded-full" />
                  <h4 className="text-lg font-bold text-slate-800">General Accounts</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassignedAccounts.map(account => (
                    <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h4 className="text-lg font-bold text-slate-800">
                {filterMemberId === 'general' ? 'General Accounts' : `${members.find(m => m.id === filterMemberId)?.name}'s Accounts`}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map(account => (
                <AccountCard key={account.id} account={account} onClick={() => onSelectAccount(account.id)} />
              ))}
              {filteredAccounts.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No accounts found for this selection.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountCard({ account, onClick }: { account: Account, onClick: () => void, key?: React.Key }) {
  const Icon = typeIcons[account.type] || Wallet;
  
  return (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
          <Icon className="text-slate-600 group-hover:text-primary w-5 h-5" />
        </div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{account.type.replace('_', ' ')}</p>
      <h5 className="text-lg font-bold text-slate-800 mb-2 truncate">{account.name}</h5>
      <div className="flex items-center justify-between">
        <p className="text-xl font-bold text-primary financial-number">৳{account.current_balance.toLocaleString()}</p>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}
