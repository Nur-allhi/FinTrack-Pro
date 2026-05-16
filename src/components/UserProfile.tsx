import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, ShieldCheck, KeyRound, Database, Upload, RefreshCw, Loader2, CheckCircle2, Eye, EyeOff, Calendar, Info } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from './Toast';

interface UserProfileProps {
  userEmail: string;
  onRefreshData: () => Promise<void>;
  onExportData: () => void;
  onClearCache: () => void;
}

export default function UserProfile({ userEmail, onRefreshData, onExportData, onClearCache }: UserProfileProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [provider, setProvider] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [userId, setUserId] = useState('');
  const [showUserId, setShowUserId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authService.apiFetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) {
        setUserId(d.user.id || '');
        if (d.user.email) setProvider('email');
      }
    }).catch(() => {});
    const storedName = localStorage.getItem('user_name') || '';
    setName(storedName);
    setOriginalName(storedName);
  }, []);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      localStorage.setItem('user_name', name);
      toast('Name updated.', 'success');
    } catch {
      toast('Failed to update name.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    setChangingPassword(true);
    try {
      const sb = await authService.getClient();
      if (!sb) throw new Error('Supabase not configured');
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('Password updated.', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast(err?.message || 'Failed to update password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await authService.apiFetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported successfully.', 'success');
    } catch { toast('Failed to export data.', 'error'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.members || !data.accounts) throw new Error('Invalid format');
      const res = await authService.apiFetch('/api/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || `Server error (${res.status})`); }
      toast('Data imported. Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to import.', 'error'); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleClearAll = async () => {
    if (!confirm('This will permanently delete ALL data. Are you sure?')) return;
    if (!confirm('Final confirmation: this cannot be undone. Clear everything?')) return;
    try {
      const res = await authService.apiFetch('/api/export/clear-all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      localStorage.clear();
      sessionStorage.clear();
      toast('All data cleared. Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch { toast('Failed to clear data.', 'error'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-12 md:pb-16 px-3 md:px-4">
      <div className="flex items-center gap-3 md:gap-6">
        <div className="w-12 md:w-16 h-12 md:h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-xl md:text-3xl font-bold text-white">{userEmail[0].toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-normal text-ink tracking-tight">Profile</h1>
          <p className="text-xs md:text-sm text-muted font-medium">{userEmail}</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="card-xl space-y-5">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <h4 className="text-base font-normal text-ink uppercase tracking-tight">Account Info</h4>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-hairline">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted" />
              <span className="text-xs font-semibold text-ink">Email</span>
            </div>
            <span className="text-xs text-muted">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-hairline">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted" />
              <span className="text-xs font-semibold text-ink">Name</span>
            </div>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-40 md:w-56 text-right text-xs bg-transparent border-none outline-none text-ink placeholder:text-muted/50 font-medium" />
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-hairline">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-muted" />
              <span className="text-xs font-semibold text-ink">Provider</span>
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Email / Password</span>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveName} disabled={saving}
              className="btn-primary text-xs px-6 py-2">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card-xl space-y-5">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-primary" />
          <h4 className="text-base font-normal text-ink uppercase tracking-tight">Security</h4>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Current Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••"
              className="w-full px-4 py-3 bg-surface-soft border border-hairline rounded-md text-ink outline-none focus:border-primary transition-all text-sm" />
          </div>
          <div className="relative">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">New Password</label>
            <div className="flex gap-2">
              <input type={showPasswords ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters"
                className="flex-1 px-4 py-3 bg-surface-soft border border-hairline rounded-md text-ink outline-none focus:border-primary transition-all text-sm" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                className="px-3 text-muted hover:text-ink">
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={changingPassword || !currentPassword || !newPassword}
              className="btn-primary text-xs px-6 py-2">
              {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Data */}
      <div className="card-xl space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-primary" />
          <h4 className="text-base font-normal text-ink uppercase tracking-tight">Data</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={onRefreshData}
            className="p-4 bg-surface-soft border border-hairline rounded-xl text-left hover:bg-canvas hover:border-primary transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center border border-hairline group-hover:border-primary transition-colors shrink-0">
                <RefreshCw className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Refresh</p>
                <p className="text-xs text-muted">Re-fetch all data from server</p>
              </div>
            </div>
          </button>
          <button onClick={handleExport}
            className="p-4 bg-surface-soft border border-hairline rounded-xl text-left hover:bg-canvas hover:border-primary transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center border border-hairline group-hover:border-primary transition-colors shrink-0">
                <Database className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Export</p>
                <p className="text-xs text-muted">Download all data as JSON</p>
              </div>
            </div>
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="p-4 bg-surface-soft border border-hairline rounded-xl text-left hover:bg-canvas hover:border-primary transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center border border-hairline group-hover:border-primary transition-colors shrink-0">
                {importing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Import</p>
                <p className="text-xs text-muted">Restore from a JSON backup</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </button>
          <button onClick={handleClearAll}
            className="p-4 bg-semantic-down/5 border border-semantic-down/10 rounded-xl text-left hover:bg-semantic-down/10 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center border border-semantic-down/10 shrink-0">
                <Database className="w-4 h-4 text-semantic-down" />
              </div>
              <div>
                <p className="text-sm font-semibold text-semantic-down">Clear All Data</p>
                <p className="text-xs text-semantic-down/60">Wipes database + local storage</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* User ID collapsed */}
      <button onClick={() => setShowUserId(!showUserId)}
        className="w-full text-center text-[10px] font-bold text-muted hover:text-ink uppercase tracking-wider transition-colors">
        {showUserId ? 'Hide' : 'Show'} technical details
      </button>
      {showUserId && (
        <div className="card-xl">
          <p className="text-xs text-muted break-all font-mono">User ID: {userId}</p>
        </div>
      )}
    </div>
  );
}
