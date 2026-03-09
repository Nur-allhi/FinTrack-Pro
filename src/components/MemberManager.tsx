import React, { useState } from 'react';
import { Member } from '../types';
import { Plus, X, User, Trash2 } from 'lucide-react';

interface MemberManagerProps {
  members: Member[];
  onUpdate: () => void;
}

export default function MemberManager({ members, onUpdate }: MemberManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relationship: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      setIsAdding(false);
      setNewMember({ name: '', relationship: '' });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will not delete their accounts but they will become 'General'.")) return;
    try {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Family Members</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-800">Add New Member</h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                required
                value={newMember.name}
                onChange={e => setNewMember({...newMember, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Relationship</label>
              <input 
                type="text" 
                value={newMember.relationship}
                onChange={e => setNewMember({...newMember, relationship: e.target.value})}
                placeholder="e.g. Father, Spouse, Self"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
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
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                <User className="w-6 h-6" />
              </div>
              <button 
                onClick={() => handleDelete(member.id)}
                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">{member.name}</h4>
            <p className="text-sm font-medium text-slate-500">{member.relationship || 'Family Member'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
