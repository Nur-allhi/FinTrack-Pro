import React from 'react';
import { Account, Member } from '../types';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';
import { CURRENCY_OPTIONS } from '../utils/currency';

const colors = [
  '#0052ff', '#05b169', '#cf202f', '#f59e0b', '#7c828a', 
  '#0a0b0d', '#14B8A6', '#EC4899', '#64748B', '#F97316'
];

interface AccountFormProps {
  title: string;
  newAcc: {
    name: string;
    type: Account['type'];
    member_id: string | number;
    parent_id: string;
    color: string;
    initial_balance: string;
    currency?: string;
  };
  setNewAcc: (v: AccountFormProps['newAcc']) => void;
  members: Member[];
  groups: { id: number; name: string }[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  defaultCurrency?: string;
}

export default function AccountForm({ title, newAcc, setNewAcc, members, groups, saving, onSubmit, onCancel, defaultCurrency = 'USD' }: AccountFormProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-ink">{title}</h4>
        <button onClick={onCancel} className="p-1 text-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Name</label>
          <input type="text" required value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})}
            placeholder="Account name" className="w-full px-3.5 py-2.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm font-medium" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Type</label>
          <Select value={newAcc.type} onChange={v => setNewAcc({...newAcc, type: v as Account['type']})}
            options={[
              { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' },
              { value: 'mobile', label: 'Mobile Wallet' }, { value: 'investment', label: 'Investment' },
              { value: 'purpose', label: 'Purpose Fund' }, { value: 'home_exp', label: 'Expenses' }
            ]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Member</label>
          <Select value={newAcc.member_id} onChange={v => setNewAcc({...newAcc, member_id: v})}
            options={[{ value: '', label: 'None' }, ...members.map(m => ({ value: m.id, label: m.name }))]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Group</label>
          <Select value={newAcc.parent_id} onChange={v => setNewAcc({...newAcc, parent_id: v})}
            options={[{ value: '', label: 'None' }, ...groups.map(g => ({ value: String(g.id), label: g.name }))]} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Currency</label>
          <Select value={newAcc.currency || defaultCurrency} onChange={v => setNewAcc({...newAcc, currency: v})}
            options={CURRENCY_OPTIONS} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Opening Balance</label>
          <input type="number" value={newAcc.initial_balance} onChange={e => setNewAcc({...newAcc, initial_balance: e.target.value})}
            placeholder="0.00" className="w-full px-3.5 py-2.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-sm financial-number" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Color</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setNewAcc({...newAcc, color: c})}
                className={cn("w-7 h-7 rounded-full transition-all border-2", newAcc.color === c ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-xs px-5 py-1.5">{saving ? 'Saving...' : (title.includes('Edit') ? 'Update' : 'Create')}</button>
        </div>
      </form>
    </>
  );
}
