import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, Loader2, Wallet, Building2, Smartphone, TrendingUp, Target, Home, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { localDb } from '../services/localDb';
import { authService } from '../services/authService';
import { generateId } from '../utils/ids';
import GroupForm from './GroupForm';
import GroupGridView, { type Group } from './GroupGridView';
import Modal from './Modal';

const colors = ['#A78BFA', '#05b169', '#cf202f', '#f59e0b', '#7c828a', '#13111C', '#14B8A6', '#EC4899', '#64748B', '#F97316'];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Wallet, bank: Building2, mobile: Smartphone,
  investment: TrendingUp, purpose: Target, home_exp: Home,
};

interface GroupManagerProps {
  onUpdate: () => void;
  lastUpdate?: number;
  currency?: string;
  onSelectAccount?: (id: number) => void;
  selectedGroupId?: number | null;
  onSelectGroup?: (id: number | null) => void;
}

export default function GroupManager({ onUpdate, lastUpdate, currency, onSelectAccount, selectedGroupId, onSelectGroup }: GroupManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', member_id: '', color: colors[0] });

  const fetchGroups = async () => {
    try {
      const [localGroups, localMembers] = await Promise.all([
        localDb.getGroups(),
        localDb.getMembers(),
      ]);
      setGroups(localGroups.map(g => ({
        id: g.server_id ?? 0,
        name: g.name,
        member_id: g.member_id ? Number(g.member_id) : null,
        member_name: localMembers.find(m => m.server_id != null && m.server_id === Number(g.member_id))?.name || undefined,
        color: g.color,
        archived: 0,
        child_count: g.child_count ?? 0,
        accumulated_balance: g.accumulated_balance ?? 0,
        children: g.children ?? [],
        type: g.type || 'group',
      })));
      setMembers(localMembers.map(m => ({ id: m.server_id ?? 0, name: m.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [lastUpdate]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      const memberId = newGroup.member_id === '' ? null : newGroup.member_id;

      if (editingGroup) {
        const localGroups = await localDb.getGroups();
        const local = localGroups.find(g => g.server_id === editingGroup.id);
        if (local) {
          const updated = {
            ...local,
            name: newGroup.name,
            member_id: memberId,
            color: newGroup.color,
            updated_at: now,
            sync_status: 'synced' as const,
          };
          await localDb.putGroup(updated);
          const body: Record<string, unknown> = { name: newGroup.name, color: newGroup.color };
          if (memberId !== null) body.member_id = Number(memberId);
          else body.member_id = null;
          const res = await authService.apiFetch(`/api/groups/${editingGroup.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            await localDb.putGroup({ ...local, name: newGroup.name, member_id: memberId, color: newGroup.color, updated_at: now, sync_status: 'pending' });
            toast("Saved locally. Will sync when online.", 'success');
          }
        }
      } else {
        const body: Record<string, unknown> = { name: newGroup.name, color: newGroup.color };
        if (memberId !== null) body.member_id = Number(memberId);
        const res = await authService.apiFetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          await localDb.putGroup({
            id: generateId(),
            server_id: data.id,
            name: newGroup.name,
            type: 'group',
            member_id: memberId,
            color: newGroup.color,
            child_count: 0,
            accumulated_balance: 0,
            children: [],
            updated_at: now,
            sync_status: 'synced' as const,
            _deleted: false,
          });
        } else {
          const errBody = await res.json().catch(() => ({}));
          toast(errBody?.error || `Server error (${res.status})`, 'error');
          setIsAdding(false);
          setEditingGroup(null);
          setNewGroup({ name: '', member_id: '', color: colors[0] });
          return;
        }
      }
      setIsAdding(false);
      setEditingGroup(null);
      setNewGroup({ name: '', member_id: '', color: colors[0] });
      fetchGroups();
      onUpdate();
    } catch (err) {
      const now = new Date().toISOString();
      const memberId = newGroup.member_id === '' ? null : newGroup.member_id;
      if (editingGroup) {
        const localGroups = await localDb.getGroups();
        const local = localGroups.find(g => g.server_id === editingGroup.id);
        if (local) {
          await localDb.putGroup({ ...local, name: newGroup.name, member_id: memberId, color: newGroup.color, updated_at: now, sync_status: 'pending' });
        }
      } else {
        await localDb.putGroup({
          id: generateId(),
          name: newGroup.name,
          type: 'group',
          member_id: memberId,
          color: newGroup.color,
          child_count: 0,
          accumulated_balance: 0,
          children: [],
          updated_at: now,
          sync_status: 'pending' as const,
          _deleted: false,
        });
      }
      setIsAdding(false);
      setEditingGroup(null);
      setNewGroup({ name: '', member_id: '', color: colors[0] });
      fetchGroups();
      onUpdate();
      toast("Saved locally. Will sync when online.", 'success');
      console.error(err);
    }
  };

  const startEdit = (g: Group) => {
    setEditingGroup(g);
    setNewGroup({ name: g.name, member_id: g.member_id?.toString() || '', color: g.color });
    setIsAdding(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete group "${name}"? Child accounts will be unlinked but not deleted.`)) return;
    setDeletingId(id);
    try {
      const now = new Date().toISOString();
      const res = await authService.apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const localGroups = await localDb.getGroups();
        const local = localGroups.find(g => g.server_id === id);
        if (local) {
          await localDb.putGroup({ ...local, _deleted: true, sync_status: 'synced', updated_at: now });
        }
        toast("Group deleted.", 'success');
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast(errBody?.error || `Server error (${res.status})`, 'error');
      }
      fetchGroups();
      onUpdate();
    } catch (err) {
      const localGroups = await localDb.getGroups();
      const local = localGroups.find(g => g.server_id === id);
      if (local) {
        await localDb.putGroup({ ...local, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
      }
      fetchGroups();
      onUpdate();
      toast("Deleted locally. Will sync when online.", 'success');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const totalAccumulated = groups.reduce((s, g) => s + (g.accumulated_balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-normal text-ink tracking-tight">Account Groups</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-soft p-0.5 rounded-pill border border-hairline">
            <button onClick={() => setViewMode('grid')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'grid' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>Grid</button>
            <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 rounded-pill text-[10px] font-bold transition-all", viewMode === 'list' ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink")}>List</button>
          </div>
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs px-4 py-2">
            <Plus className="w-3.5 h-3.5" /> New Group
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-1">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{groups.length} groups</span>
        <span className="w-px h-3 bg-hairline" />
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Total: <span className="text-ink font-mono">{currency || '৳'}{totalAccumulated.toLocaleString()}</span></span>
      </div>

      <Modal open={isAdding} onClose={() => { setIsAdding(false); setEditingGroup(null); }} title={editingGroup ? 'Edit Group' : 'New Group'}>
        <GroupForm
          editingGroup={!!editingGroup}
          newGroup={newGroup}
          setNewGroup={setNewGroup}
          members={members}
          saving={false}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsAdding(false); setEditingGroup(null); }}
        />
      </Modal>

      {viewMode === 'grid' ? (
        <GroupGridView
          groups={groups}
          currency={currency || '৳'}
          deletingId={deletingId}
          onEdit={startEdit}
          onDelete={handleDelete}
          onSelectGroup={(id) => onSelectGroup?.(id)}
        />
      ) : (
        <>
          <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap">Group</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Member</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right">Accounts</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right">Balance</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <AnimatePresence initial={false}>
                {groups.map(group => (
                  <motion.tr key={group.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    onClick={() => onSelectGroup?.(group.id)}
                    className="hover:bg-surface-soft/30 transition-colors cursor-pointer">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="text-base font-semibold text-ink">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-muted shrink-0" />
                        <span className="text-xs font-medium text-muted">{group.member_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs font-bold text-muted">{group.child_count}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={e => { e.stopPropagation(); startEdit(group); }} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(group.id, group.name); }} disabled={deletingId === group.id} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors disabled:opacity-50" title="Delete">
                          {deletingId === group.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            <AnimatePresence initial={false}>
            {groups.map(group => (
              <motion.div key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: 'transform, opacity' }}
                onClick={() => onSelectGroup?.(group.id)}
                className="bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-ink truncate">{group.name}</span>
                    <span className="text-sm font-bold text-ink financial-number shrink-0">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                      <User className="w-3 h-3 shrink-0" />
                      {group.member_name || 'General'}
                    </span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs font-bold text-muted">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={e => { e.stopPropagation(); startEdit(group); }} className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider">Edit</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(group.id, group.name); }} disabled={deletingId === group.id} className="text-[10px] font-bold text-muted hover:text-semantic-down uppercase tracking-wider disabled:opacity-50">
                      {deletingId === group.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {groups.length === 0 && loading && (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto" />
        </div>
      )}

      {groups.length === 0 && !loading && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline">
            <Layers className="w-6 h-6 text-muted" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">No groups yet</p>
          <p className="text-xs text-muted font-medium">Create groups to organize your accounts.</p>
        </div>
      )}

      <Modal open={selectedGroupId !== null && !isAdding} onClose={() => onSelectGroup?.(null)} title={selectedGroup?.name || ''}
        subtitle={selectedGroup?.member_name ? <><User className="w-2.5 h-2.5" /> {selectedGroup.member_name}</> : undefined}>
        {selectedGroup ? (
          <div className="space-y-1">
            {selectedGroup.children.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No accounts in this group</p>
            ) : selectedGroup.children.map((child, idx) => {
                const Icon = typeIcons[child.type] || Wallet;
                return (
                  <button key={child.id}
                    onClick={() => onSelectAccount?.(child.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:bg-surface-soft cursor-pointer group/row",
                      idx !== selectedGroup.children.length - 1 && "border-b border-hairline"
                    )}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface-soft">
                        <Icon className="w-3.5 h-3.5 text-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{child.name}</p>
                        <p className="inline-flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                          <User className="w-2.5 h-2.5" />
                          {child.member_name || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-ink financial-number">{currency || '৳'}{child.current_balance?.toLocaleString() || '0'}</span>
                      <ChevronRight className="w-4 h-4 text-muted group-hover/row:text-ink transition-colors" />
                    </div>
                  </button>
                );
              }).concat(
                <div key="total" className="flex items-center justify-between p-3 border-t border-hairline mt-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 shrink-0"></div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Total</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-ink financial-number">{currency || '৳'}{selectedGroup.children.reduce((sum, c) => sum + (c.current_balance || 0), 0).toLocaleString()}</span>
                    <div className="w-4"></div>
                  </div>
                </div>)}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" />
          </div>
        )}
      </Modal>
    </div>
  );
}
