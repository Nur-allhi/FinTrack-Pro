import React, { useState, useEffect } from 'react';
import { Account, Member } from '../types';
import { cn } from '../utils/cn';
import AccountCard from './AccountCard';
import {
  Wallet,
  Building2,
  Smartphone,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Users,
  Plus,
  ArrowLeftRight,
  Check,
  X,
  SlidersHorizontal
} from 'lucide-react';

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
    darkMode: boolean;
    fontSize: string;
    currency: string;
    typeColors?: Record<string, string>;
  };
}

export default function Dashboard({ 
  accounts, 
  members, 
  filterMemberId, 
  setFilterMemberId, 
  onSelectAccount, 
  onOpenTransfer,
  onOpenTransaction,
  onGenerateReport,
  settings
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'cash' | 'mobile' | 'investment' | 'other'>('all');
  const [showFilters, setShowFilters] = useState(false);
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

  const [todos, setTodos] = useState<{id: number; text: string; done: boolean}[]>(() => {
    try { return JSON.parse(localStorage.getItem('dashboard_todos') || '[]'); }
    catch { return []; }
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    localStorage.setItem('dashboard_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Hero / Summary Section */}
      {(settings.showNetWorth || settings.showCurrentAssets || settings.showLiabilities) && (
        <div className="bg-primary/5 p-6 md:p-12 lg:p-16 rounded-xl relative overflow-hidden border border-primary/10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-[64px] md:blur-[128px] -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
            <div className="space-y-4 md:space-y-6">
              <div>
                <p className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.3em] mb-2 md:mb-4">Total Balance</p>
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-normal text-ink tracking-[-0.03em] financial-number">
                  {settings.currency}{totalBalance.toLocaleString()}
                </h3>
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

            <div className="bg-canvas/80 backdrop-blur-sm rounded-xl border border-hairline p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Quick Tasks</p>
                {todos.length > 0 && (
                  <span className="text-[10px] font-bold text-primary">{todos.filter(t => !t.done).length} pending</span>
                )}
              </div>
              <div className="space-y-1 mb-3 max-h-[180px] overflow-y-auto">
                {todos.length === 0 ? (
                  <p className="text-[11px] text-muted italic">No tasks yet. Add one below.</p>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-2 group py-0.5">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${todo.done ? 'bg-primary border-primary' : 'border-hairline hover:border-muted'}`}
                      >
                        {todo.done && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 text-xs ${todo.done ? 'line-through text-muted' : 'text-ink'}`}>{todo.text}</span>
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-semantic-down transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={addTodo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a task..."
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  className="flex-1 bg-surface-soft border border-hairline rounded-pill px-3 py-1.5 text-xs text-ink placeholder:text-muted outline-none focus:border-primary transition-colors"
                />
                <button type="submit" className="btn-primary px-3 py-1.5 text-[10px]">Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex items-center gap-3">
        <button onClick={onOpenTransaction} className="btn-primary px-6 py-3 text-xs md:text-sm">
          <Plus className="w-4 h-4" />
          New Transaction
        </button>
        <button onClick={onOpenTransfer} className="btn-pill bg-canvas text-ink border border-hairline px-6 py-3 text-xs md:text-sm hover:bg-surface-soft transition-colors">
          <ArrowLeftRight className="w-4 h-4" />
          Inter-Account Transfer
        </button>
      </div>

      {/* Accounts List Section */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base md:text-lg font-normal text-ink tracking-tight">Your Portfolio</h4>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden px-3 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
                showFilters || filterType !== 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <div className="flex items-center gap-2 bg-surface-soft p-0.5 rounded-pill border border-hairline">
              <button onClick={() => setViewMode('grid')} className={cn("px-3 md:px-4 py-1 rounded-pill text-[10px] md:text-xs font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
              <button onClick={() => setViewMode('list')} className={cn("px-3 md:px-4 py-1 rounded-pill text-[10px] md:text-xs font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
            </div>
          </div>
        </div>

        {/* Desktop filter pills */}
        <div className="hidden md:flex flex-wrap gap-1.5">
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
                style={filterType === f.key ? { backgroundColor: typeColor || '#0052FF' } : {}}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Mobile filter card */}
        {showFilters && (
          <div className="md:hidden bg-canvas rounded-xl border border-hairline p-3 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {typeFilters.map(f => {
                const Icon = f.icon;
                const typeColor = settings.typeColors?.[f.key];
                return (
                  <button key={f.key} onClick={() => setFilterType(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all",
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
        )}

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


