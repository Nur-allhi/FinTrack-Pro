import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Member } from '../types';
import { Plus, X, Edit2, Archive, Wallet, Building2, Smartphone, TrendingUp, Target, Home } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import Select from './Select';

interface AccountManagerProps {
  accounts: Account[];
  members: Member[];
  onUpdate: () => void;
  currency: string;
  typeColors?: Record<string, string>;
}

const colors = [
  '#0052ff', '#05b169', '#cf202f', '#f59e0b', '#7c828a', 
  '#0a0b0d', '#14B8A6', '#EC4899', '#64748B', '#F97316'
];

const typeIcons: Record<string, any> = {
  cash: Wallet,
  bank: Building2,
  mobile: Smartphone,
  investment: TrendingUp,
  purpose: Target,
  home_exp: Home,
};

export default function AccountManager({ accounts, members, onUpdate, currency, typeColors }: AccountManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>('all');
  const [newAcc, setNewAcc] = useState({
    name: '',
    type: 'cash' as Account['type'],
    member_id: '' as string | number,
    parent_id: '' as string,
    color: colors[0],
    initial_balance: ''
  });

  useEffect(() => {
    authService.apiFetch('/api/groups').then(r => r.ok && r.json()).then(d => setGroups(d || [])).catch(() => {});
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingAccount ? 'PATCH' : 'POST';
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      
      const res = await authService.apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAcc,
          member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
          parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
          initial_balance: parseFloat(newAcc.initial_balance || '0')
        })
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingAccount(null);
        setNewAcc({ name: '', type: 'cash', member_id: '', parent_id: '', color: colors[0], initial_balance: '' });
        onUpdate();
      }
    } catch (error) {
      toast("Failed to save account.", 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNewAcc({
      name: acc.name,
      type: acc.type,
      member_id: acc.member_id || '',
      parent_id: acc.parent_id?.toString() || '',
      color: acc.color,
      initial_balance: acc.initial_balance.toString()
    });
    setIsAdding(true);
  };

  const toggleArchive = async (id: number, current: number) => {
    try {
      await authService.apiFetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: current ? 0 : 1 })
      });
      onUpdate();
    } catch (error) {
      toast("Failed to update account.", 'error');
      console.error(error);
    }
  };

  const activeAccounts = accounts.filter(a => !a.archived);
  const filteredAccounts = accounts.filter(acc => {
    if (selectedMemberId === 'all') return true;
    if (selectedMemberId === 'general') return !acc.member_id;
    return acc.member_id === Number(selectedMemberId);
  });
  const totalBalance = filteredAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  const renderForm = (title: string) => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-ink">{title}</h4>
        <button onClick={() => { setIsAdding(false); setEditingAccount(null); }} className="p-1 text-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Name</label>
          <input type="text" required value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})}
            placeholder="Account name" className="w-full px-3.5 py-2.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm font-medium" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Type</label>
          <Select value={newAcc.type} onChange={v => setNewAcc({...newAcc, type: v as any})}
            options={[
              { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' },
              { value: 'mobile', label: 'Mobile Wallet' }, { value: 'investment', label: 'Investment' },
              { value: 'purpose', label: 'Purpose Fund' }, { value: 'home_exp', label: 'Expenses' }
            ]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Member</label>
          <Select value={newAcc.member_id} onChange={v => setNewAcc({...newAcc, member_id: v})}
            options={[{ value: '', label: 'None' }, ...members.map(m => ({ value: m.id, label: m.name }))]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Group</label>
          <Select value={newAcc.parent_id} onChange={v => setNewAcc({...newAcc, parent_id: v})}
            options={[{ value: '', label: 'None' }, ...groups.map(g => ({ value: String(g.id), label: g.name }))]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Opening Balance</label>
          <input type="number" value={newAcc.initial_balance} onChange={e => setNewAcc({...newAcc, initial_balance: e.target.value})}
            placeholder="0.00" className="w-full px-3.5 py-2.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm financial-number" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Color</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setNewAcc({...newAcc, color: c})}
                className={cn("w-7 h-7 rounded-full transition-all border-2", newAcc.color === c ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => { setIsAdding(false); setEditingAccount(null); }} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-xs px-5 py-1.5">{saving ? 'Saving...' : (editingAccount ? 'Update' : 'Create')}</button>
        </div>
      </form>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="text-lg font-normal text-ink tracking-tight">Accounts</h3>
          <Select
            value={selectedMemberId}
            onChange={v => setSelectedMemberId(v === 'all' || v === 'general' ? v : Number(v))}
            options={[
              { value: 'all', label: 'All Members' },
              { value: 'general', label: 'Unassigned' },
              ...members.map(m => ({ value: m.id, label: m.name.toUpperCase() }))
            ]}
            className="w-full max-w-[180px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-soft p-0.5 rounded-pill border border-hairline">
            <button onClick={() => setViewMode('grid')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
            <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
          </div>
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs px-4 py-2">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{filteredAccounts.length} accounts</span>
        <span className="w-px h-3 bg-hairline" />
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Balance: <span className="text-ink font-mono">{currency}{totalBalance.toLocaleString()}</span></span>
        {filteredAccounts.filter(a => a.archived).length > 0 && (
          <>
            <span className="w-px h-3 bg-hairline" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{filteredAccounts.filter(a => a.archived).length} archived</span>
          </>
        )}
      </div>

      {/* Add form at top (only for new accounts) */}
      <AnimatePresence>
        {isAdding && !editingAccount && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card-xl border-primary/20 bg-primary/5 mb-3">
              {renderForm('Add Account')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filteredAccounts.map(acc => {
              const isEditing = editingAccount?.id === acc.id;
              const Icon = typeIcons[acc.type] || Wallet;
              return (
                <motion.div key={acc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                  {isEditing ? (
                    <div className="card-xl border-primary/20 bg-primary/5">
                      {renderForm('Edit Account')}
                    </div>
                  ) : (
                    <div className="bg-canvas rounded-xl border border-hairline overflow-hidden transition-all hover:shadow-md group">
                      <div className="h-1" style={{ backgroundColor: acc.color }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: typeColors?.[acc.type] || acc.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-semibold text-ink truncate">{acc.name}</h4>
                              <p className="text-xs font-bold text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {acc.archived && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-pill">Archived</span>}
                          </div>
                        </div>
                        <p className="text-xl font-bold text-ink financial-number tracking-tighter mb-3">{currency}{acc.current_balance.toLocaleString()}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-hairline">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">{acc.member_name || 'GENERAL'}</span>
                            {acc.parent_name && (
                              <>
                                <span className="text-muted/40">/</span>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider truncate">{acc.parent_name}</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(acc)} className="p-2 md:p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit">
                              <Edit2 className="w-4 md:w-3.5 h-4 md:h-3.5" />
                            </button>
                            <button onClick={() => toggleArchive(acc.id, acc.archived)} className="p-2 md:p-1.5 text-muted hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors" title={acc.archived ? "Activate" : "Archive"}>
                              <Archive className="w-4 md:w-3.5 h-4 md:h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap">Account</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Member</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Group</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right">Balance</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredAccounts.map(acc => {
                  const Icon = typeIcons[acc.type] || Wallet;
                  return (
                    <tr key={acc.id} className="hover:bg-surface-soft/30 transition-colors group">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                          <span className="text-base font-semibold text-ink">{acc.name}</span>
                          {acc.archived && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-pill">Archived</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="text-xs font-medium text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-muted">{acc.member_name || '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-primary">{acc.parent_name || '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{currency}{acc.current_balance.toLocaleString()}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(acc)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toggleArchive(acc.id, acc.archived)} className="p-1.5 text-muted hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors" title={acc.archived ? "Activate" : "Archive"}><Archive className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {editingAccount && (
              <div className="p-4 border-t border-hairline bg-primary/5">
                {renderForm('Edit Account')}
              </div>
            )}
          </div>
          {/* Mobile compact cards */}
          <div className="md:hidden space-y-2">
            {filteredAccounts.map(acc => {
              const isEditing = editingAccount?.id === acc.id;
              if (isEditing) {
                return (
                  <div key={acc.id} className="card-xl border-primary/20 bg-primary/5">
                    {renderForm('Edit Account')}
                  </div>
                );
              }
              const Icon = typeIcons[acc.type] || Wallet;
              return (
                <div key={acc.id} className="bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: acc.color + '15', color: acc.color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-ink truncate">{acc.name}</span>
                      <span className="text-sm font-bold text-ink financial-number shrink-0">{currency}{acc.current_balance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</span>
                      <span className="text-muted/40">·</span>
                      <span className="text-xs font-medium text-muted">{acc.member_name || 'General'}</span>
                      {acc.parent_name && (
                        <>
                          <span className="text-muted/40">·</span>
                          <span className="text-xs font-medium text-primary">{acc.parent_name}</span>
                        </>
                      )}
                      {acc.archived && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-pill">A</span>}
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => startEdit(acc)} className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider">Edit</button>
                      <button onClick={() => toggleArchive(acc.id, acc.archived)} className="text-[10px] font-bold text-muted hover:text-amber-600 uppercase tracking-wider">{acc.archived ? 'Activate' : 'Archive'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {filteredAccounts.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline">
            <Plus className="w-6 h-6 text-muted" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">No accounts found</p>
          <p className="text-xs text-muted font-medium">Create your first account to start tracking.</p>
        </div>
      )}
    </div>
  );
}
