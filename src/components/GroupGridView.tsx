import React from 'react';
import { Edit2, Trash2, Layers, Loader2, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  deletingId: number | null;
  onEdit: (g: Group) => void;
  onDelete: (id: number, name: string) => void;
  onSelectGroup: (id: number) => void;
}

export default function GroupGridView({ groups, currency, deletingId, onEdit, onDelete, onSelectGroup }: GroupGridViewProps) {
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
          onClick={() => onSelectGroup(group.id)}
          className="bg-canvas rounded-xl border border-hairline overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + '15', color: group.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-ink truncate">{group.name}</h4>
                  {group.member_name && (
                    <p className="inline-flex items-center gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                      <User className="w-3 h-3" />
                      {group.member_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); onEdit(group); }} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); onDelete(group.id, group.name); }} disabled={deletingId === group.id} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors disabled:opacity-50" title="Delete">
                  {deletingId === group.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-xl font-bold text-ink financial-number tracking-tighter mb-1">{currency}{group.accumulated_balance?.toLocaleString() || '0'}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{group.child_count} account{group.child_count !== 1 ? 's' : ''}</p>
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
            </div>
          </div>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
