import React, { useState } from 'react';
import { Member, Account } from '../types';
import { Plus, X, User, Trash2, Wallet, Building2, Smartphone, TrendingUp, Target, Home, ArrowLeft } from 'lucide-react';
import { useToast } from './Toast';
import { authService } from '../services/authService';

interface MemberManagerProps {
  members: Member[];
  accounts: Account[];
  onUpdate: () => void;
  onSelectAccount: (id: number) => void;
  currency?: string;
  typeColors?: Record<string, string>;
}

const typeIcons: Record<string, any> = {
  cash: Wallet, bank: Building2, mobile: Smartphone,
  investment: TrendingUp, purpose: Target, home_exp: Home,
};

export default function MemberManager({ members, accounts, onUpdate, onSelectAccount, currency, typeColors }: MemberManagerProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({ name: '', relationship: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.apiFetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      setIsAdding(false);
      setNewMember({ name: '', relationship: '' });
      onUpdate();
    } catch (error) {
      toast("Failed to create member.", 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? Their accounts will become unassigned.")) return;
    try {
      await authService.apiFetch(`/api/members/${id}`, { method: 'DELETE' });
      if (selectedMember?.id === id) setSelectedMember(null);
      onUpdate();
    } catch (error) {
      toast("Failed to delete member.", 'error');
    }
  };

  if (selectedMember) {
    const memberAccounts = accounts.filter(a => a.member_id === selectedMember.id && !a.archived);
    return (
      <div className="space-y-4 md:space-y-6">
        <button onClick={() => setSelectedMember(null)}
          className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-semibold text-[10px] md:text-sm">
          <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" /> Back to Members
        </button>

        <div className="p-4 md:p-5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-normal text-ink tracking-tight">{selectedMember.name}</h3>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">{selectedMember.relationship || 'Member'} · {memberAccounts.length} account{memberAccounts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Total Balance</p>
              <p className="text-xl md:text-2xl font-bold text-ink financial-number">{currency || '৳'}{memberAccounts.reduce((s, a) => s + (a.current_balance || 0), 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          {memberAccounts.map(acc => {
            const Icon = typeIcons[acc.type] || Wallet;
            return (
              <button key={acc.id} onClick={() => onSelectAccount(acc.id)}
                className="w-full bg-canvas p-3 md:p-4 rounded-xl border border-hairline flex items-center gap-3 text-left transition-all hover:border-primary hover:shadow-sm group">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: typeColors?.[acc.type] || acc.color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-ink truncate">{acc.name}</span>
                    <span className="text-sm font-bold text-ink financial-number shrink-0">{currency || '৳'}{acc.current_balance.toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</p>
                </div>
              </button>
            );
          })}
          {memberAccounts.length === 0 && (
            <div className="py-12 text-center text-sm text-muted">No accounts assigned to this member.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-2xl lg:text-3xl font-normal text-ink tracking-tight">Members</h3>
        <button onClick={() => setIsAdding(true)} className="btn-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-3">
          <Plus className="w-4 md:w-5 h-4 md:h-5" /> Add Member
        </button>
      </div>

      {isAdding && (
        <div className="card-xl border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-normal text-ink">New Member</h4>
            <button onClick={() => setIsAdding(false)} className="p-1 md:p-2 text-muted hover:text-ink">
              <X className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Name</label>
              <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})}
                placeholder="e.g. John Doe" className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm font-medium" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Relationship</label>
              <input type="text" value={newMember.relationship} onChange={e => setNewMember({...newMember, relationship: e.target.value})}
                placeholder="e.g. Spouse, Self" className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm font-medium" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 md:gap-4 pt-4 md:pt-6">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-xs md:text-sm px-6 md:px-10 py-2 md:py-3">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {members.map(member => (
          <button key={member.id} onClick={() => setSelectedMember(member)}
            className="bg-canvas p-4 md:p-5 rounded-xl border border-hairline text-left transition-all hover:border-primary hover:shadow-sm group relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center text-ink group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-ink truncate">{member.name}</h4>
                <p className="text-xs font-bold text-muted uppercase tracking-wider">{member.relationship || 'MEMBER'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                className="p-1.5 text-muted hover:text-semantic-down opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </button>
        ))}
      </div>

      {members.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline">
            <User className="w-6 h-6 text-muted" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">No members yet</p>
          <p className="text-xs text-muted font-medium">Add family members to organize accounts.</p>
        </div>
      )}
    </div>
  );
}
