import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Member } from '../types';
import { Plus, Edit2, Archive, Wallet, Building2, Smartphone, TrendingUp, Target, Home } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import Select from './Select';
import AccountForm from './AccountForm';
import AccountListView from './AccountListView';

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

export default function AccountManager({ accounts, members, onUpdate, currency, typeColors }: AccountManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>('all');
  const [newAcc, setNewAcc] = useState({
    name: '', type: 'cash' as Account['type'], member_id: '' as string | number,
    parent_id: '' as string, color: colors[0], initial_balance: ''
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
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAcc,
          member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
          parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
          initial_balance: parseFloat(newAcc.initial_balance || '0')
        })
      });
      if (res.ok) {
        setIsAdding(false); setEditingAccount(null);
        setNewAcc({ name: '', type: 'cash', member_id: '', parent_id: '', color: colors[0], initial_balance: '' });
        onUpdate();
      }
    } catch (error) {
      toast("Failed to save account.", 'error');
      console.error(error);
    } finally { setSaving(false); }
  };

  const startEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNewAcc({ name: acc.name, type: acc.type, member_id: acc.member_id || '', parent_id: acc.parent_id?.toString() || '', color: acc.color, initial_balance: acc.initial_balance.toString() });
    setIsAdding(true);
  };

  const toggleArchive = async (id: number, current: number) => {
    try {
      await authService.apiFetch(`/api/accounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: current ? 0 : 1 }) });
      onUpdate();
    } catch (error) { toast("Failed to update account.", 'error'); console.error(error); }
  };

  const filteredAccounts = accounts.filter(acc => {
    if (selectedMemberId === 'all') return true;
    if (selectedMemberId === 'general') return !acc.member_id;
    return acc.member_id === Number(selectedMemberId);
  });
  const totalBalance = filteredAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  const renderForm = (title: string) => (
    <AccountForm title={title} newAcc={newAcc} setNewAcc={setNewAcc} members={members} groups={groups} saving={saving} onSubmit={handleCreateOrUpdate} onCancel={() => { setIsAdding(false); setEditingAccount(null); }} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="text-lg font-normal text-ink tracking-tight">Accounts</h3>
          <Select value={selectedMemberId} onChange={v => setSelectedMemberId(v === 'all' || v === 'general' ? v : Number(v))}
            options={[{ value: 'all', label: 'All Members' }, { value: 'general', label: 'Unassigned' }, ...members.map(m => ({ value: m.id, label: m.name.toUpperCase() }))]}
            className="w-full max-w-[180px]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-soft p-0.5 rounded-pill border border-hairline">
            <button onClick={() => setViewMode('grid')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
            <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
          </div>
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs px-4 py-2"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-1">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{filteredAccounts.length} accounts</span>
        <span className="w-px h-3 bg-hairline" />
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Balance: <span className="text-ink font-mono">{currency}{totalBalance.toLocaleString()}</span></span>
        {filteredAccounts.filter(a => a.archived).length > 0 && (
          <><span className="w-px h-3 bg-hairline" /><span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{filteredAccounts.filter(a => a.archived).length} archived</span></>
        )}
      </div>

      <AnimatePresence>
        {isAdding && !editingAccount && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card-xl border-primary/20 bg-primary/5 mb-3">{renderForm('Add Account')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filteredAccounts.map(acc => {
              const isEditing = editingAccount?.id === acc.id;
              return (
                <motion.div key={acc.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                  {isEditing ? (
                    <div className="card-xl border-primary/20 bg-primary/5">{renderForm('Edit Account')}</div>
                  ) : (
                    <AccountGridCard acc={acc} currency={currency} typeColors={typeColors} onEdit={startEdit} onToggleArchive={toggleArchive} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <AccountListView accounts={filteredAccounts} currency={currency} typeColors={typeColors} onEdit={startEdit} onToggleArchive={toggleArchive} editingAccount={editingAccount} renderForm={() => renderForm('Edit Account')} />
      )}

      {filteredAccounts.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline"><Plus className="w-6 h-6 text-muted" /></div>
          <p className="text-sm font-semibold text-ink mb-1">No accounts found</p>
          <p className="text-xs text-muted font-medium">Create your first account to start tracking.</p>
        </div>
      )}
    </div>
  );
}

function AccountGridCard({ acc, currency, typeColors, onEdit, onToggleArchive }: { acc: Account; currency: string; typeColors?: Record<string, string>; onEdit: (a: Account) => void; onToggleArchive: (id: number, current: number) => void }) {
  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = { cash: Wallet, bank: Building2, mobile: Smartphone, investment: TrendingUp, purpose: Target, home_exp: Home };
  const Icon = typeIcons[acc.type] || Wallet;
  return (
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
            {acc.parent_name && (<><span className="text-muted/40">/</span><span className="text-xs font-bold text-primary uppercase tracking-wider truncate">{acc.parent_name}</span></>)}
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(acc)} className="p-2 md:p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-4 md:w-3.5 h-4 md:h-3.5" /></button>
            <button onClick={() => onToggleArchive(acc.id, acc.archived)} className="p-2 md:p-1.5 text-muted hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors" title={acc.archived ? "Activate" : "Archive"}><Archive className="w-4 md:w-3.5 h-4 md:h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
