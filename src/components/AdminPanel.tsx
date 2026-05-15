import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Mail, Trash2, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from './Toast';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authService.apiFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      const res = await authService.apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast('User created successfully', 'success');
        setNewEmail('');
        setNewPassword('');
        setShowForm(false);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Delete user "${userEmail}"? This cannot be undone.`)) return;
    try {
      const res = await authService.apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast('User deleted', 'success');
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">User Management</h2>
          <p className="text-sm text-muted mt-1">Create and manage user accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-soft rounded-xl border border-hairline p-8">
          <h3 className="text-lg font-semibold text-ink mb-6">New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-5 py-4 bg-canvas border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary transition-all outline-none text-sm"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Password</label>
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 bg-canvas border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary transition-all outline-none text-sm"
                placeholder="At least 6 characters"
              />
            </div>
            {error && (
              <div className="bg-semantic-down/5 text-semantic-down p-3 rounded-md text-xs font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-semantic-down shrink-0" />
                {error}
              </div>
            )}
            <button type="submit" disabled={isCreating} className="btn-primary w-full h-[48px] text-sm">
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-surface-soft rounded-xl border border-hairline overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider">
            Registered Users ({users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">No users yet</div>
        ) : (
          <div className="divide-y divide-hairline">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{user.email}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {user.provider === 'google' ? 'Google' : 'Email/Password'} &middot;
                      Created {new Date(user.created_at).toLocaleDateString()}
                      {user.last_sign_in_at && ` · Last login ${new Date(user.last_sign_in_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="p-2 text-muted hover:text-semantic-down transition-colors rounded-md hover:bg-semantic-down/5"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
