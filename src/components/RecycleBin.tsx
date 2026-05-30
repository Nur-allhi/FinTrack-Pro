import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Wallet, Handshake, Receipt, Clock } from 'lucide-react';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import { motion, AnimatePresence } from 'motion/react';

interface DeletedItem {
  entity_type: 'transactions' | 'accounts' | 'loans';
  entity_label: string;
  id: number;
  deleted_at: string;
  summary: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  transactions: { icon: Receipt, color: 'text-amber-500' },
  accounts: { icon: Wallet, color: 'text-emerald-500' },
  loans: { icon: Handshake, color: 'text-violet-500' },
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
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [acting, setActing] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== 'all' ? `?type=${filter}` : '';
      const res = await authService.apiFetch(`/api/recyclebin${qs}?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      toast('Failed to load recycle bin.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleRestore = async (item: DeletedItem) => {
    const key = `${item.entity_type}-${item.id}`;
    setActing(key);
    try {
      const res = await authService.apiFetch(`/api/recyclebin/${item.entity_type}/${item.id}/restore`, { method: 'POST' });
      if (res.ok) {
        toast(`${item.entity_label} restored.`, 'success');
        fetchItems();
      } else {
        toast('Restore failed.', 'error');
      }
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
      const res = await authService.apiFetch(`/api/recyclebin/${item.entity_type}/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast(`${item.entity_label} permanently deleted.`, 'success');
        fetchItems();
      } else {
        toast('Delete failed.', 'error');
      }
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
      const qs = filter !== 'all' ? `?type=${filter}` : '';
      const res = await authService.apiFetch(`/api/recyclebin${qs}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Recycle bin emptied.', 'success');
        fetchItems();
      } else {
        toast('Failed to empty recycle bin.', 'error');
      }
    } catch {
      toast('Failed to empty recycle bin.', 'error');
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
            {items.length} deleted item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {items.length > 0 && (
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'transactions', 'accounts', 'loans'].map((t) => (
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
                  className="bg-canvas p-3 md:p-4 rounded-xl border border-hairline flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-surface-soft shrink-0`}>
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
    </div>
  );
}
