import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Member } from '../types';
import { Plus, Edit2, Archive, Wallet, Building2, Smartphone, TrendingUp, Target, Home, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import Select from './Select';
import AccountForm from './AccountForm';
import AccountListView from './AccountListView';
import Modal from './Modal';

interface AccountManagerProps {
  accounts: Account[];
  members: Member[];
  onUpdate: () => void;
  currency: string;
  typeColors?: Record<string, string>;
  onSelectAccount?: (id: number) => void;
}

const colors = [
  '#A78BFA', '#05b169', '#cf202f', '#f59e0b', '#7c828a', 
  '#13111C', '#14B8A6', '#EC4899', '#64748B', '#F97316'
];

export default function AccountManager({ accounts, members, onUpdate, currency, typeColors, onSelectAccount }: AccountManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>('all');
  const [newAcc, setNewAcc] = useState<{
    name: string; type: Account['type']; member_id: string | number;
    parent_id: string; color: string; initial_balance: string; currency?: string;
  }>({
    name: '', type: 'cash' as Account['type'], member_id: '' as string | number,
    parent_id: '' as string, color: colors[0], initial_balance: '', currency: currency
  });

  useEffect(() => {
    localDb.getGroups().then(all => setGroups(all.map(g => ({ id: g.server_id ?? 0, name: g.name })))).catch(() => {});
  }, [isAdding]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingAccount ? 'PATCH' : 'POST';
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const body: Record<string, unknown> = {
        name: newAcc.name,
        type: newAcc.type,
        color: newAcc.color || undefined,
        initial_balance: parseFloat(newAcc.initial_balance || '0'),
      };
      if (editingAccount) {
        body.member_id = newAcc.member_id === '' ? null : Number(newAcc.member_id);
        body.parent_id = newAcc.parent_id === '' ? null : Number(newAcc.parent_id);
      } else {
        if (newAcc.member_id !== '') body.member_id = Number(newAcc.member_id);
        if (newAcc.parent_id !== '') body.parent_id = Number(newAcc.parent_id);
      }
      const res = await authService.apiFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        const now = new Date().toISOString();
        const initialBal = parseFloat(newAcc.initial_balance || '0');
        if (editingAccount) {
          const allAccounts = await localDb.getAccounts();
          const local = allAccounts.find(a => a.server_id === editingAccount.id);
          if (local) {
            await localDb.putAccount({
              ...local,
              name: newAcc.name,
              type: newAcc.type,
              member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
              parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
              color: newAcc.color,
              initial_balance: initialBal,
              current_balance: initialBal,
              updated_at: now,
              sync_status: 'synced',
            });
          }
        } else {
          await localDb.putAccount({
            id: generateId(),
            server_id: data.id,
            name: newAcc.name,
            type: newAcc.type,
            member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
            parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
            color: newAcc.color,
            archived: 0,
            initial_balance: initialBal,
            current_balance: initialBal,
            currency: newAcc.currency || currency,
            updated_at: now,
            sync_status: 'synced',
            _deleted: false,
          });
        }
        setIsAdding(false); setEditingAccount(null);
        setNewAcc({ name: '', type: 'cash', member_id: '', parent_id: '', color: colors[0], initial_balance: '', currency: currency });
        onUpdate();
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast(errBody?.error || `Server error (${res.status})`, 'error');
      }
    } catch (error) {
      const now = new Date().toISOString();
      const initialBal = parseFloat(newAcc.initial_balance || '0');
      if (editingAccount) {
        const allAccounts = await localDb.getAccounts();
        const local = allAccounts.find(a => a.server_id === editingAccount.id);
        if (local) {
          await localDb.putAccount({
            ...local,
            name: newAcc.name,
            type: newAcc.type,
            member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
            parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
            color: newAcc.color,
            initial_balance: initialBal,
            current_balance: initialBal,
            updated_at: now,
            sync_status: 'pending',
          });
        }
      } else {
        await localDb.putAccount({
          id: generateId(),
          name: newAcc.name,
          type: newAcc.type,
          member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
          parent_id: newAcc.parent_id === '' ? null : Number(newAcc.parent_id),
          color: newAcc.color,
          archived: 0,
          initial_balance: initialBal,
          current_balance: initialBal,
          currency: newAcc.currency || currency,
          updated_at: now,
          sync_status: 'pending',
          _deleted: false,
        });
      }
      setIsAdding(false); setEditingAccount(null);
      setNewAcc({ name: '', type: 'cash', member_id: '', parent_id: '', color: colors[0], initial_balance: '', currency: currency });
      toast("Saved locally. Will sync when online.", 'success');
      onUpdate();
      console.error(error);
    } finally { setSaving(false); }
  };

  const startEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNewAcc({ name: acc.name, type: acc.type, member_id: acc.member_id ? String(acc.member_id) : '', parent_id: acc.parent_id?.toString() || '', color: acc.color, initial_balance: acc.initial_balance.toString(), currency: acc.currency || currency });
    setIsAdding(true);
  };

  const toggleArchive = async (id: number, current: number, localId?: string) => {
    try {
      const res = await authService.apiFetch(`/api/accounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: current ? 0 : 1 }) });
      if (!res.ok) throw new Error('API error');
      onUpdate();
    } catch (error) {
      const allAccounts = await localDb.getAccounts();
      const local = localId
        ? allAccounts.find(a => a.id === localId)
        : allAccounts.find(a => a.server_id === id);
      if (local) {
        await localDb.putAccount({ ...local, archived: current ? 0 : 1, updated_at: new Date().toISOString(), sync_status: 'pending' });
        toast("Saved locally. Will sync when online.", 'success');
        onUpdate();
      } else {
        toast("Failed to update account.", 'error');
      }
      console.error(error);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    if (selectedMemberId === 'all') return true;
    if (selectedMemberId === 'general') return !acc.member_id;
    return acc.member_id == Number(selectedMemberId);
  });
  const totalBalance = filteredAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  return (
    <>
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

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 app-stagger-grid">
          <AnimatePresence>
            {filteredAccounts.map(acc => (
              <motion.div key={acc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                <AccountGridCard acc={acc} currency={currency} typeColors={typeColors} onEdit={startEdit} onToggleArchive={toggleArchive} onSelect={() => onSelectAccount?.(acc.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <AccountListView accounts={filteredAccounts} currency={currency} typeColors={typeColors} onEdit={startEdit} onToggleArchive={toggleArchive} onSelectAccount={onSelectAccount} />
      )}

      {filteredAccounts.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline"><Plus className="w-6 h-6 text-muted" /></div>
          <p className="text-sm font-semibold text-ink mb-1">No accounts found</p>
          <p className="text-xs text-muted font-medium">Create your first account to start tracking.</p>
        </div>
      )}
    </div>

    <Modal open={isAdding} onClose={() => { setIsAdding(false); setEditingAccount(null); }} title={editingAccount ? 'Edit Account' : 'Add Account'}>
      <AccountForm title={editingAccount ? 'Edit Account' : 'Add Account'} newAcc={newAcc} setNewAcc={setNewAcc} members={members} groups={groups} saving={saving} onSubmit={handleCreateOrUpdate} onCancel={() => { setIsAdding(false); setEditingAccount(null); }} defaultCurrency={currency} currentBalance={editingAccount?.current_balance} />
    </Modal>
  </>
  );
}

function AccountGridCard({ acc, currency, typeColors, onEdit, onToggleArchive, onSelect }: { acc: Account; currency: string; typeColors?: Record<string, string>; onEdit: (a: Account) => void; onToggleArchive: (id: number, current: number, localId?: string) => void; onSelect?: () => void }) {
  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = { cash: Wallet, bank: Building2, mobile: Smartphone, investment: TrendingUp, purpose: Target, home_exp: Home };
  const Icon = typeIcons[acc.type] || Wallet;
  return (
    <div onClick={onSelect} className="bg-canvas rounded-xl border border-hairline overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
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
            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted uppercase tracking-wider">
              <User className="w-3 h-3" />
              {acc.member_name || 'GENERAL'}
            </span>
            {acc.parent_name && (<><span className="text-muted/40">/</span><span className="text-xs font-bold text-primary uppercase tracking-wider truncate">{acc.parent_name}</span></>)}
          </div>
          <div className="flex gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(acc); }} className="p-2 md:p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-4 md:w-3.5 h-4 md:h-3.5" /></button>
            <button onClick={e => { e.stopPropagation(); onToggleArchive(acc.id, acc.archived, acc._localId); }} className="p-2 md:p-1.5 text-muted hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors" title={acc.archived ? "Activate" : "Archive"}><Archive className="w-4 md:w-3.5 h-4 md:h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
