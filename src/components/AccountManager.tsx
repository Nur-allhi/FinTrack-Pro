import React, { useState } from 'react';
import { Account, Member } from '../types';
import { Plus, X, Palette, Trash2, Archive, ChevronRight } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  members: Member[];
  onUpdate: () => void;
  currency: string;
}

const colors = [
  '#1A5FCC', '#7DD8E6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#64748B', '#06B6D4', '#F97316'
];

export default function AccountManager({ accounts, members, onUpdate, currency }: AccountManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>('all');
  const [newAcc, setNewAcc] = useState({
    name: '',
    type: 'cash' as Account['type'],
    member_id: '' as string | number,
    color: colors[0],
    initial_balance: ''
  });

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingAccount ? 'PATCH' : 'POST';
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAcc,
          member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
          initial_balance: parseFloat(newAcc.initial_balance || '0')
        })
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingAccount(null);
        setNewAcc({ name: '', type: 'cash', member_id: '', color: colors[0], initial_balance: '' });
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNewAcc({
      name: acc.name,
      type: acc.type,
      member_id: acc.member_id || '',
      color: acc.color,
      initial_balance: acc.initial_balance.toString()
    });
    setIsAdding(true);
  };

  const toggleArchive = async (id: number, current: number) => {
    try {
      await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: current ? 0 : 1 })
      });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center sm:text-left">Financial Accounts</h3>
          <div className="flex justify-center">
            <div className="relative w-full max-w-[200px] sm:max-w-none">
              <select 
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all appearance-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Members</option>
                <option value="general">General (No Member)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Account
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-primary/20 dark:border-primary/40 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingAccount ? 'Edit Account' : 'Create New Account'}</h4>
            <button onClick={() => { setIsAdding(false); setEditingAccount(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Name</label>
              <input 
                type="text" 
                required
                value={newAcc.name}
                onChange={e => setNewAcc({...newAcc, name: e.target.value})}
                placeholder="e.g. Dutch Bangla Bank"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Type</label>
              <div className="relative">
                <select 
                  value={newAcc.type}
                  onChange={e => setNewAcc({...newAcc, type: e.target.value as any})}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Account</option>
                  <option value="mobile">Mobile Banking (bKash/Nagad)</option>
                  <option value="investment">Investment</option>
                  <option value="purpose">Purpose Fund</option>
                  <option value="home_exp">Home Expenses</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assign to Member</label>
              <div className="relative">
                <select 
                  value={newAcc.member_id}
                  onChange={e => setNewAcc({...newAcc, member_id: e.target.value})}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="">General (No Member)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Initial Balance</label>
              <input 
                type="number" 
                value={newAcc.initial_balance}
                onChange={e => setNewAcc({...newAcc, initial_balance: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Display Color</label>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewAcc({...newAcc, color: c})}
                    className={`w-10 h-10 rounded-full transition-all ${newAcc.color === c ? 'ring-4 ring-primary/20 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingAccount(null); }}
                className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts
          .filter(acc => {
            if (selectedMemberId === 'all') return true;
            if (selectedMemberId === 'general') return !acc.member_id;
            return acc.member_id === Number(selectedMemberId);
          })
          .map(acc => (
          <div key={acc.id} className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col ${acc.archived ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: acc.color }} />
              <div className="flex gap-1">
                <button 
                  onClick={() => startEdit(acc)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Edit"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toggleArchive(acc.id, acc.archived)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title={acc.archived ? "Unarchive" : "Archive"}
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{acc.name}</h4>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">{acc.type.replace('_', ' ')}</p>
            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{acc.member_name || 'General Account'}</span>
              <span className="text-lg font-bold text-primary financial-number">{currency}{acc.current_balance.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
