import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Layers, ChevronDown, Wallet } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import Select from './Select';

interface GroupChild {
  id: number;
  name: string;
  type: string;
  current_balance: number;
  member_name?: string;
}

interface Group {
  id: number;
  name: string;
  member_id: number | null;
  member_name?: string;
  color: string;
  archived: number;
  child_count: number;
  accumulated_balance: number;
  children: GroupChild[];
}

const colors = ['#0052ff', '#05b169', '#cf202f', '#f59e0b', '#7c828a', '#0a0b0d', '#14B8A6', '#EC4899', '#64748B', '#F97316'];

export default function GroupManager({ onUpdate, lastUpdate, currency }: { onUpdate: () => void; lastUpdate?: number; currency?: string }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
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
    try {
      await authService.apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
      toast("Group deleted.", 'success');
      fetchGroups();
      onUpdate();
    } catch (err) {
      toast("Failed to delete group.", 'error');
    }
  };

  const totalAccumulated = groups.reduce((s, g) => s + (g.accumulated_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Summary */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{groups.length} groups</span>
        <span className="w-px h-3 bg-hairline" />
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total: <span className="text-ink font-mono">{currency || '৳'}{totalAccumulated.toLocaleString()}</span></span>
      </div>

      {/* Form */}
      {isAdding && (
        <div className="card-xl border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-normal text-ink">{editingGroup ? 'Edit Group' : 'New Group'}</h4>
            <button onClick={() => { setIsAdding(false); setEditingGroup(null); }} className="p-1 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Group Name</label>
              <input type="text" required value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                placeholder="e.g. HK Bank" className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Member</label>
              <Select
                value={newGroup.member_id}
                onChange={v => setNewGroup({...newGroup, member_id: v})}
                options={[
                  { value: '', label: 'None' },
                  ...members.map(m => ({ value: String(m.id), label: m.name }))
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Color</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {colors.map(c => (
                  <button key={c} type="button" onClick={() => setNewGroup({...newGroup, color: c})}
                    className={cn("w-7 h-7 rounded-full transition-all border-2", newGroup.color === c ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsAdding(false); setEditingGroup(null); }} className="btn-secondary text-xs px-5 py-2">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-xs px-6 py-2">{saving ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map(group => (
            <div key={group.id} className="bg-canvas rounded-xl border border-hairline overflow-hidden transition-all hover:shadow-md group">
              <div className="h-1" style={{ backgroundColor: group.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ink truncate">{group.name}</h4>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{group.member_name || 'GENERAL'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(group)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-xl font-bold text-ink financial-number tracking-tighter mb-1">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</p>
                <button onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                  className="w-full flex items-center justify-between pt-3 border-t border-hairline text-[10px] font-bold text-muted uppercase tracking-wider hover:text-ink transition-colors">
                  <span>{expandedId === group.id ? 'Hide' : 'Show'} accounts</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedId === group.id && "rotate-180")} />
                </button>
                {expandedId === group.id && group.children && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-hairline">
                    {group.children.length === 0 ? (
                      <p className="text-xs text-muted italic">No accounts assigned</p>
                    ) : (
                      group.children.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between py-1.5 px-3 bg-surface-soft rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <Wallet className="w-3 h-3 text-muted shrink-0" />
                            <span className="text-xs font-medium text-ink truncate">{child.name}</span>
                          </div>
                          <span className="text-xs font-bold text-ink financial-number shrink-0 ml-2">{currency || '৳'}{child.current_balance?.toLocaleString() || '0'}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em] border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap">Group</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Member</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right">Accounts</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right">Balance</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {groups.map(group => (
                  <tr key={group.id} className="hover:bg-surface-soft/30 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="text-sm font-semibold text-ink">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-muted">{group.member_name || '-'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs font-bold text-muted">{group.child_count}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(group)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile compact cards */}
          <div className="md:hidden space-y-2">
            {groups.map(group => (
              <div key={group.id} className="bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">{group.name}</span>
                    <span className="text-sm font-bold text-ink financial-number shrink-0">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-muted">{group.member_name || 'General'}</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-[10px] font-bold text-muted">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => startEdit(group)} className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider">Edit</button>
                    <button onClick={() => handleDelete(group.id, group.name)} className="text-[10px] font-bold text-muted hover:text-semantic-down uppercase tracking-wider">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
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


