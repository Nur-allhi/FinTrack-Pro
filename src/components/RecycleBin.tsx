import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Wallet, Handshake, Receipt, User, Layers, Clock, ThumbsUp, CloudOff, type LucideIcon } from 'lucide-react';
import { useToast } from './Toast';
import { localDb, type LocalRecord, type EntityName } from '../services/localDb';
import { authService } from '../services/authService';
import { motion, AnimatePresence } from 'motion/react';

interface DeletedItem {
  entity_type: string;
  entity_label: string;
  id: string;
  deleted_at: string;
  summary: string;
  server_id?: number | null;
}

interface ConflictItem {
  entity_type: string;
  record: LocalRecord;
  summary: string;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  transactions: { icon: Receipt, color: 'text-amber-500' },
  accounts: { icon: Wallet, color: 'text-emerald-500' },
  loans: { icon: Handshake, color: 'text-violet-500' },
  members: { icon: User, color: 'text-blue-500' },
  groups: { icon: Layers, color: 'text-rose-500' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function RecycleBin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'deleted' | 'conflicts'>('deleted');
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [acting, setActing] = useState<string | null>(null);

  // Conflict state
  const [conflictItems, setConflictItems] = useState<ConflictItem[]>([]);
  const [conflictLoading, setConflictLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const allDeleted = await localDb.getDeletedItems();
      setItems(filter === 'all' ? allDeleted : allDeleted.filter(i => i.entity_type === filter));
    } catch {
      toast('Failed to load recycle bin.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  const fetchConflicts = useCallback(async () => {
    setConflictLoading(true);
    try {
      const records = await localDb.getConflictRecords();
      setConflictItems(records);
    } catch {
      toast('Failed to load conflicts.', 'error');
    } finally {
      setConflictLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (tab === 'conflicts') fetchConflicts();
  }, [tab, fetchConflicts]);

  const handleRestore = async (item: DeletedItem) => {
    const key = `${item.entity_type}-${item.id}`;
    setActing(key);
    try {
      await localDb.restoreItem(item.entity_type, item.id);
      toast(`${item.entity_label} restored.`, 'success');
      fetchItems();
    } catch {
      toast('Restore failed.', 'error');
    } finally {
      setActing(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (!confirm(`Permanently delete this ${item.entity_label.toLowerCase()}? This cannot be undone.`)) return;
    const key = `${item.entity_type}-${item.id}`;
    setActing(key);
    try {
      await localDb.permanentDelete(item.entity_type, item.id);
      if (item.server_id != null) {
        authService.apiFetch(`/api/recyclebin/${item.entity_type}/${item.server_id}`, { method: 'DELETE' }).catch(() => {});
      }
      toast(`${item.entity_label} permanently deleted.`, 'success');
      fetchItems();
    } catch {
      toast('Delete failed.', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleEmptyAll = async () => {
    if (!confirm('Permanently delete ALL items in the recycle bin? This cannot be undone.')) return;
    setActing('empty-all');
    try {
      const type = filter !== 'all' ? filter : undefined;
      await localDb.emptyBin(type);
      authService.apiFetch(`/api/recyclebin${type ? `?type=${type}` : ''}`, { method: 'DELETE' }).catch(() => {});
      toast('Recycle bin emptied.', 'success');
      fetchItems();
    } catch {
      toast('Failed to empty recycle bin.', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleKeepLocal = async (item: ConflictItem) => {
    const key = `keep-local-${item.entity_type}-${item.record.id}`;
    setActing(key);
    try {
      await localDb.resolveConflict(item.entity_type as EntityName, item.record.id, 'keep_local');
      toast('Conflict resolved — your version will be kept.', 'success');
      fetchConflicts();
    } catch {
      toast('Failed to resolve conflict.', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleAcceptServer = async (item: ConflictItem) => {
    const key = `accept-server-${item.entity_type}-${item.record.id}`;
    setActing(key);
    try {
      await localDb.resolveConflict(item.entity_type as EntityName, item.record.id, 'keep_server');
      toast('Conflict resolved — server version will be accepted.', 'success');
      fetchConflicts();
    } catch {
      toast('Failed to resolve conflict.', 'error');
    } finally {
      setActing(null);
    }
  };

  const grouped = items.reduce<Record<string, DeletedItem[]>>((acc, item) => {
    (acc[item.entity_type] = acc[item.entity_type] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Recycle Bin</h1>
          <p className="text-xs text-muted font-semibold mt-0.5">
            {tab === 'deleted'
              ? `${items.length} deleted item${items.length !== 1 ? 's' : ''}`
              : `${conflictItems.length} sync conflict${conflictItems.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {tab === 'deleted' && items.length > 0 && (
          <button
            onClick={handleEmptyAll}
            disabled={acting === 'empty-all'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-semantic-down bg-semantic-down/5 border border-semantic-down/20 hover:bg-semantic-down/10 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {acting === 'empty-all' ? 'Emptying...' : 'Empty Bin'}
          </button>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('deleted')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'deleted'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-soft text-muted border border-hairline hover:text-ink'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
          Deleted Items
        </button>
        <button
          onClick={() => setTab('conflicts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'conflicts'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-soft text-muted border border-hairline hover:text-ink'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Sync Conflicts
        </button>
      </div>

      {/* Deleted Items Tab */}
      {tab === 'deleted' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'transactions', 'accounts', 'loans', 'members', 'groups'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === t
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-soft text-muted border border-hairline hover:text-ink'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                {t !== 'all' && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {items.filter((i) => i.entity_type === t).length || grouped[t]?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Trash2 className="w-12 h-12 text-hairline mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted">Recycle bin is empty</p>
              <p className="text-xs text-muted/60 mt-1">Deleted items will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => {
                  const cfg = typeConfig[item.entity_type] || typeConfig.transactions;
                  const Icon = cfg.icon;
                  const isActing = acting === `${item.entity_type}-${item.id}`;
                  return (
                    <motion.div
                      key={`${item.entity_type}-${item.id}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      style={{ willChange: 'transform, opacity' }}
                      className="bg-canvas p-3 md:p-4 rounded-xl border border-hairline flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-soft shrink-0">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {item.summary || `${item.entity_label} #${item.id}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-muted uppercase">{item.entity_label}</span>
                          <span className="text-muted/30">·</span>
                          <Clock className="w-3 h-3 text-muted/60" />
                          <span className="text-[10px] text-muted">{timeAgo(item.deleted_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={isActing}
                          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isActing}
                          className="p-2 rounded-lg text-muted hover:text-semantic-down hover:bg-semantic-down/5 transition-all disabled:opacity-50"
                          title="Permanent delete"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Conflicts Tab */}
      {tab === 'conflicts' && (
        conflictLoading ? (
          <div className="py-16 text-center text-sm text-muted">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            Loading conflicts...
          </div>
        ) : conflictItems.length === 0 ? (
          <div className="py-16 text-center">
            <CloudOff className="w-12 h-12 text-hairline mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted">No sync conflicts</p>
            <p className="text-xs text-muted/60 mt-1">All records are in sync</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {conflictItems.map((item) => {
                const cfg = typeConfig[item.entity_type] || typeConfig.transactions;
                const Icon = cfg.icon;
                const keepKey = `keep-local-${item.entity_type}-${item.record.id}`;
                const acceptKey = `accept-server-${item.entity_type}-${item.record.id}`;
                return (
                  <motion.div
                    key={`conflict-${item.entity_type}-${item.record.id}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="bg-canvas p-3 md:p-4 rounded-xl border border-semantic-down/20 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-semantic-down/10 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-semantic-down" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.summary}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-muted uppercase">{item.entity_type}</span>
                        <span className="text-muted/30">·</span>
                        <Clock className="w-3 h-3 text-muted/60" />
                        <span className="text-[10px] text-muted">{timeAgo(item.record.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleKeepLocal(item)}
                        disabled={acting === keepKey || acting === acceptKey}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all disabled:opacity-50"
                        title="Keep your version"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {acting === keepKey ? '...' : 'Keep mine'}
                      </button>
                      <button
                        onClick={() => handleAcceptServer(item)}
                        disabled={acting === keepKey || acting === acceptKey}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted bg-surface-soft border border-hairline hover:text-ink transition-all disabled:opacity-50"
                        title="Accept server version"
                      >
                        <CloudOff className="w-3.5 h-3.5" />
                        {acting === acceptKey ? '...' : 'Accept server'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
}
