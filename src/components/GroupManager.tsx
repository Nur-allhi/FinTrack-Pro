import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import GroupForm from './GroupForm';
import GroupGridView, { type Group } from './GroupGridView';

const colors = ['#0052ff', '#05b169', '#cf202f', '#f59e0b', '#7c828a', '#0a0b0d', '#14B8A6', '#EC4899', '#64748B', '#F97316'];

export default function GroupManager({ onUpdate, lastUpdate, currency }: { onUpdate: () => void; lastUpdate?: number; currency?: string }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', member_id: '', color: colors[0] });

  const fetchGroups = async () => {
    try {
      const [gRes, mRes] = await Promise.all([authService.apiFetch('/api/groups'), authService.apiFetch('/api/members')]);
      if (gRes.ok) setGroups(await gRes.json());
      if (mRes.ok) setMembers(await mRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [lastUpdate]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingGroup ? 'PATCH' : 'POST';
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const res = await authService.apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroup.name,
          member_id: newGroup.member_id === '' ? null : Number(newGroup.member_id),
          color: newGroup.color
        })
      });
      if (res.ok) {
        setIsAdding(false);
        setEditingGroup(null);
        setNewGroup({ name: '', member_id: '', color: colors[0] });
        fetchGroups();
        onUpdate();
      }
    } catch (err) {
      toast("Failed to save group.", 'error');
    } finally {
      setSaving(false);
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
      await authService.apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
      toast("Group deleted.", 'success');
      fetchGroups();
      onUpdate();
    } catch (err) {
      toast("Failed to delete group.", 'error');
    } finally {
      setDeletingId(null);
    }
  };

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

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <GroupForm
              editingGroup={!!editingGroup}
              newGroup={newGroup}
              setNewGroup={setNewGroup}
              members={members}
              saving={saving}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => { setIsAdding(false); setEditingGroup(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <GroupGridView
          groups={groups}
          currency={currency || '৳'}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          deletingId={deletingId}
          onEdit={startEdit}
          onDelete={handleDelete}
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
                    className="hover:bg-surface-soft/30 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="text-base font-semibold text-ink">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-muted">{group.member_name || '-'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs font-bold text-muted">{group.child_count}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(group)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(group.id, group.name)} disabled={deletingId === group.id} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors disabled:opacity-50" title="Delete">
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
                className="bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-ink truncate">{group.name}</span>
                    <span className="text-sm font-bold text-ink financial-number shrink-0">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-muted">{group.member_name || 'General'}</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs font-bold text-muted">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => startEdit(group)} className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider">Edit</button>
                    <button onClick={() => handleDelete(group.id, group.name)} disabled={deletingId === group.id} className="text-[10px] font-bold text-muted hover:text-semantic-down uppercase tracking-wider disabled:opacity-50">
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
    </div>
  );
}
