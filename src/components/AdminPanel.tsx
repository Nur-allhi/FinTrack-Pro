import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Mail, Trash2, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from './Toast';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({ email: '', password: '', title: '' });
  const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storageData, setStorageData] = useState<Record<string, { totalKB: number; limitKB: number }>>({});
  const [dbTotalMB, setDbTotalMB] = useState<number | null>(null);
  const [limitTarget, setLimitTarget] = useState<{ id: string; email: string; limit: number } | null>(null);
  const limitInMB = (kb: number) => Math.round(kb / 1024);
  const [newLimit, setNewLimit] = useState('');
  const [isSettingLimit, setIsSettingLimit] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersRes, summaryRes] = await Promise.all([
        authService.apiFetch('/api/admin/users'),
        authService.apiFetch('/api/admin/storage/summary'),
      ]);
      if (usersRes.ok) {
        const data: AuthUser[] = await usersRes.json();
        setUsers(data);
        data.forEach(u => fetchStorage(u.id));
      }
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        setDbTotalMB(summary.totalMB);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorage = async (userId: string) => {
    try {
      const res = await authService.apiFetch(`/api/admin/users/${userId}/storage`);
      if (res.ok) {
        const data = await res.json();
        setStorageData(prev => ({ ...prev, [userId]: { totalKB: data.totalKB, limitKB: data.limitKB } }));
      }
    } catch {}
  };

  const handleSetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitTarget || !newLimit) return;
    setIsSettingLimit(true);
    try {
      const res = await authService.apiFetch(`/api/admin/users/${limitTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_limit_mb: Math.round(Number(newLimit) / 1024) }),
      });
      if (res.ok) {
        toast('Storage limit updated.', 'success');
        setStorageData(prev => ({ ...prev, [limitTarget.id]: { ...prev[limitTarget.id], limitKB: Number(newLimit) } }));
        setLimitTarget(null);
      }
    } catch {
      toast('Failed to update limit.', 'error');
    } finally {
      setIsSettingLimit(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsCreating(true);
    setError('');
    try {
      const res = await authService.apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setShowForm(false);
        fetchUsers();
        setPasswordModalData({ email: data.user.email, password: data.password, title: 'User Created' });
        setShowPasswordModal(true);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setIsResetting(true);
    try {
      const res = await authService.apiFetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setResetTarget(null);
        setResetPassword('');
        setPasswordModalData({ email: resetTarget.email, password: data.password, title: 'Password Reset' });
        setShowPasswordModal(true);
      }
    } catch (err) {
      toast('Failed to reset password.', 'error');
    } finally {
      setIsResetting(false);
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

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(passwordModalData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-ink">User Management</h2>
          <p className="text-xs md:text-sm text-muted mt-0.5 md:mt-1">
            {dbTotalMB !== null
              ? `Database: ${dbTotalMB.toFixed(2)} MB used`
              : 'Create and manage user accounts'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="btn-primary flex items-center justify-center gap-2 px-5 md:px-6 py-2.5 md:py-3 text-xs md:text-sm self-start"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-soft rounded-xl border border-hairline p-4 md:p-8">
          <h3 className="text-base md:text-lg font-semibold text-ink mb-4 md:mb-6">New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4 md:space-y-5">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-canvas border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary transition-all outline-none text-sm"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-canvas border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary transition-all outline-none text-sm"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Password</label>
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-canvas border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary transition-all outline-none text-sm"
                placeholder="At least 6 characters"
              />
            </div>
            {error && (
              <div className="bg-semantic-down/5 text-semantic-down p-3 rounded-md text-xs font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-semantic-down shrink-0" />
                {error}
              </div>
            )}
            <button type="submit" disabled={isCreating} className="btn-primary w-full h-[44px] md:h-[48px] text-sm">
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

      {/* Password Reveal Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-canvas rounded-2xl border border-hairline shadow-xl max-w-md w-full p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-semantic-up/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-semantic-up" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">{passwordModalData.title}</h3>
                <p className="text-xs text-muted">{passwordModalData.email}</p>
              </div>
            </div>

            <div className="bg-surface-soft rounded-xl border border-hairline p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-bold text-ink bg-canvas border border-hairline rounded-lg px-3 py-2 select-all">
                  {passwordModalData.password}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all shrink-0"
                  title="Copy password"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-semantic-up" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">This password will not be shown again. Copy it now.</p>

            <button onClick={() => setShowPasswordModal(false)} className="btn-primary w-full h-[44px] text-sm">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-canvas rounded-2xl border border-hairline shadow-xl max-w-md w-full p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Reset Password</h3>
              <button onClick={() => { setResetTarget(null); setResetPassword(''); }} className="p-1 text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted">Set a new password for <span className="font-semibold text-ink">{resetTarget.email}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-canvas border border-hairline rounded-md text-ink outline-none focus:border-primary transition-all text-sm"
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setResetTarget(null); setResetPassword(''); }} className="btn-secondary flex-1 h-[44px] text-sm">Cancel</button>
                <button type="submit" disabled={isResetting} className="btn-primary flex-1 h-[44px] text-sm">
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storage Limit Modal */}
      {limitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-canvas rounded-2xl border border-hairline shadow-xl max-w-sm w-full p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Storage Limit</h3>
              <button onClick={() => setLimitTarget(null)} className="p-1 text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted">
              Set storage limit for <span className="font-semibold text-ink">{limitTarget.email}</span>
            </p>
            <form onSubmit={handleSetLimit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Limit (KB)</label>
                <input
                  type="number"
                  required
                  min={1024}
                  max={102400}
                  step={1024}
                  value={newLimit}
                  onChange={e => setNewLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-canvas border border-hairline rounded-md text-ink outline-none focus:border-primary transition-all text-sm"
                />
                <p className="text-xs text-muted">{limitInMB(Number(newLimit || 0))} MB — Range: 1 — 100 MB</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setLimitTarget(null)} className="btn-secondary flex-1 h-[44px] text-sm">Cancel</button>
                <button type="submit" disabled={isSettingLimit} className="btn-primary flex-1 h-[44px] text-sm">
                  {isSettingLimit ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface-soft rounded-xl border border-hairline overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-hairline">
          <h3 className="text-xs md:text-sm font-bold text-muted uppercase tracking-wider">
            Registered Users ({users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 md:py-16">
            <Loader2 className="w-5 md:w-6 h-5 md:h-6 animate-spin text-muted" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 md:py-16 text-muted text-sm">No users yet</div>
        ) : (
          <div className="divide-y divide-hairline">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-canvas/50 transition-colors">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{user.name || user.email}</p>
                    {user.name && <p className="text-xs text-muted truncate">{user.email}</p>}
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {user.provider === 'google' ? 'Google' : 'Email/Password'}
                      <span className="hidden md:inline"> &middot; Created {new Date(user.created_at).toLocaleDateString()}</span>
                      {user.last_sign_in_at && <span className="hidden md:inline"> &middot; Last login {new Date(user.last_sign_in_at).toLocaleDateString()}</span>}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 mr-3">
                  {storageData[user.id] && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-muted">
                        <span>{storageData[user.id].totalKB.toFixed(0)} KB</span>
                        <span className="text-muted/40">/</span>
                        <button
                          onClick={() => { setLimitTarget({ id: user.id, email: user.email, limit: storageData[user.id].limitKB }); setNewLimit(String(storageData[user.id].limitKB)); }}
                          className="text-primary hover:text-primary-active underline underline-offset-2"
                        >
                          {storageData[user.id].limitKB} KB
                        </button>
                      </div>
                      <div className="w-12 h-1.5 bg-surface-strong rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            storageData[user.id].totalKB / storageData[user.id].limitKB > 0.8
                              ? 'bg-semantic-down'
                              : storageData[user.id].totalKB / storageData[user.id].limitKB > 0.5
                                ? 'bg-amber-500'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, (storageData[user.id].totalKB / storageData[user.id].limitKB) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setResetTarget(user); setResetPassword(''); }}
                    className="p-1.5 md:p-2 text-muted hover:text-primary transition-colors rounded-md hover:bg-primary/5"
                    title="Reset password"
                  >
                    <KeyRound className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="p-1.5 md:p-2 text-muted hover:text-semantic-down transition-colors rounded-md hover:bg-semantic-down/5"
                    title="Delete user"
                  >
                    <Trash2 className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}