import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';

const colors = ['#0052ff', '#05b169', '#cf202f', '#f59e0b', '#7c828a', '#0a0b0d', '#14B8A6', '#EC4899', '#64748B', '#F97316'];

interface GroupFormProps {
  editingGroup: boolean;
  newGroup: { name: string; member_id: string; color: string };
  setNewGroup: (v: GroupFormProps['newGroup']) => void;
  members: { id: number; name: string }[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function GroupForm({ editingGroup, newGroup, setNewGroup, members, saving, onSubmit, onCancel }: GroupFormProps) {
  return (
    <div className="card-xl border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base font-normal text-ink">{editingGroup ? 'Edit Group' : 'New Group'}</h4>
        <button onClick={onCancel} className="p-1 text-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Group Name</label>
          <input type="text" required value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})}
            placeholder="e.g. HK Bank" className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm font-medium" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Member</label>
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
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Color</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setNewGroup({...newGroup, color: c})}
                className={cn("w-7 h-7 rounded-full transition-all border-2", newGroup.color === c ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="md:col-span-3 flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs px-5 py-2">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-xs px-6 py-2 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {editingGroup ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
