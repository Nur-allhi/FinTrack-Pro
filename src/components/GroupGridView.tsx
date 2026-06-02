import React from 'react';
import { Edit2, Trash2, Layers, ChevronDown, Wallet, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface GroupChild {
  id: number;
  name: string;
  type: string;
  current_balance: number;
  member_name?: string;
}

export interface Group {
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

interface GroupGridViewProps {
  groups: Group[];
  currency: string;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  deletingId: number | null;
  onEdit: (g: Group) => void;
  onDelete: (id: number, name: string) => void;
}

export default function GroupGridView({ groups, currency, expandedId, setExpandedId, deletingId, onEdit, onDelete }: GroupGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 app-stagger-grid">
      <AnimatePresence initial={false}>
      {groups.map(group => (
        <motion.div key={group.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ willChange: 'transform, opacity' }}
          className="bg-canvas rounded-xl border border-hairline overflow-hidden transition-all hover:shadow-md group">
          <div className="h-1" style={{ backgroundColor: group.color }} />
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-ink truncate">{group.name}</h4>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">{group.member_name || 'GENERAL'}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(group)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(group.id, group.name)} disabled={deletingId === group.id} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors disabled:opacity-50" title="Delete">
                  {deletingId === group.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-xl font-bold text-ink financial-number tracking-tighter mb-1">{currency || '৳'}{group.accumulated_balance?.toLocaleString() || '0'}</p>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</p>
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
                  group.children.map((child: GroupChild) => (
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
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
