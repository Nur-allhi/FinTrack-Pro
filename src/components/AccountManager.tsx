import React, { useState } from 'react';
import { Account, Member } from '../types';
import { Plus, X, Palette, Trash2, Archive } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  members: Member[];
  onUpdate: () => void;
}

const colors = [
  '#1A5FCC', '#7DD8E6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#64748B', '#06B6D4', '#F97316'
];

export default function AccountManager({ accounts, members, onUpdate }: AccountManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAcc, setNewAcc] = useState({
    name: '',
    type: 'cash' as Account['type'],
    member_id: '' as string | number,
    color: colors[0],
    initial_balance: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAcc,
          member_id: newAcc.member_id === '' ? null : Number(newAcc.member_id),
          initial_balance: parseFloat(newAcc.initial_balance || '0')
        })
      });
      setIsAdding(false);
      setNewAcc({ name: '', type: 'cash', member_id: '', color: colors[0], initial_balance: '' });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Financial Accounts</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Account
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-800">Create New Account</h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Account Name</label>
              <input 
                type="text" 
                required
                value={newAcc.name}
                onChange={e => setNewAcc({...newAcc, name: e.target.value})}
                placeholder="e.g. Dutch Bangla Bank"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Account Type</label>
              <select 
                value={newAcc.type}
                onChange={e => setNewAcc({...newAcc, type: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
                <option value="mobile">Mobile Banking (bKash/Nagad)</option>
                <option value="investment">Investment</option>
                <option value="purpose">Purpose Fund</option>
                <option value="home_exp">Home Expenses</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assign to Member</label>
              <select 
                value={newAcc.member_id}
                onChange={e => setNewAcc({...newAcc, member_id: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">General (No Member)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Initial Balance</label>
              <input 
                type="number" 
                value={newAcc.initial_balance}
                onChange={e => setNewAcc({...newAcc, initial_balance: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Display Color</label>
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
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col ${acc.archived ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: acc.color }} />
              <div className="flex gap-1">
                <button 
                  onClick={() => toggleArchive(acc.id, acc.archived)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
                  title={acc.archived ? "Unarchive" : "Archive"}
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">{acc.name}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{acc.type.replace('_', ' ')}</p>
            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{acc.member_name || 'General Account'}</span>
              <span className="text-lg font-bold text-primary financial-number">৳{acc.initial_balance.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
