import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  EyeOff, 
  Bell, 
  Moon,
  Sun,
  Globe, 
  ShieldCheck,
  Smartphone,
  Database,
  Type,
  Pencil,
  Tags,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';
import RenameModal from './RenameModal';
import { authService } from '../services/authService';
import { useToast } from './Toast';

interface AppSettings {
  showNetWorth: boolean;
  showCurrentAssets: boolean;
  showLiabilities: boolean;
  enableNotifications: boolean;
  darkMode: boolean;
  fontSize: string;
  currency: string;
  typeColors: Record<string, string>;
}

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onClearCache: () => void;
}

export default function Settings({ settings, onUpdateSettings, onExportData, onClearCache }: SettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    authService.apiFetch('/api/transactions/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleRenameCategory = async (newName: string) => {
    if (!renameTarget) return;
    const oldName = renameTarget;
    setRenameTarget(null);
    try {
      const res = await authService.apiFetch('/api/transactions/category/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName })
      });
      if (!res.ok) throw new Error('Rename failed');
      setCategories(categories.map(c => c === oldName ? newName : c));
      toast(`Category renamed to "${newName}".`, 'success');
    } catch {
      toast('Failed to rename category.', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('This will permanently delete ALL data (members, accounts, transactions, investments) and clear local storage. Are you sure?')) return;
    if (!confirm('Final confirmation: this cannot be undone. Clear everything?')) return;
    try {
      const res = await authService.apiFetch('/api/export/clear-all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear database');
      localStorage.clear();
      sessionStorage.clear();
      toast('All data cleared. Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast('Failed to clear data.', 'error');
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
    } catch {
      toast('Failed to export data.', 'error');
    }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      toast('Data imported successfully. Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to import data.', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSetting = (key: keyof AppSettings) => {
    const value = settings[key];
    if (typeof value === 'boolean') {
      onUpdateSettings({
        ...settings,
        [key]: !value
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12 md:pb-16 px-3 md:px-4">
      <div className="flex items-center gap-3 md:gap-6">
        <div className="w-10 md:w-16 h-10 md:h-16 bg-surface-soft rounded-full flex items-center justify-center border border-hairline">
          <SettingsIcon className="w-5 md:w-8 h-5 md:h-8 text-ink" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-normal text-ink tracking-tight">Settings</h1>
          <p className="text-xs md:text-sm text-muted font-medium">Configure your workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Dashboard Visibility Section */}
        <div className="card-xl space-y-5">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <h4 className="text-base font-normal text-ink uppercase tracking-tight">Display Hierarchy</h4>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  settings.showNetWorth ? "bg-primary/5 text-primary" : "bg-surface-soft text-muted"
                )}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Total Balance</p>
                  <p className="text-xs text-muted">Hero summary visibility</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showNetWorth')}
                className={cn(
                  "w-12 h-6 rounded-pill transition-all relative",
                  settings.showNetWorth ? "bg-primary" : "bg-surface-strong"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all",
                  settings.showNetWorth ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  settings.showCurrentAssets ? "bg-primary/5 text-primary" : "bg-surface-soft text-muted"
                )}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Liquid Assets</p>
                  <p className="text-xs text-muted">Primary asset card visibility</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showCurrentAssets')}
                className={cn(
                  "w-12 h-6 rounded-pill transition-all relative",
                  settings.showCurrentAssets ? "bg-primary" : "bg-surface-strong"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all",
                  settings.showCurrentAssets ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  settings.showLiabilities ? "bg-primary/5 text-primary" : "bg-surface-soft text-muted"
                )}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Total Liabilities</p>
                  <p className="text-xs text-muted">Debt summary visibility</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showLiabilities')}
                className={cn(
                  "w-12 h-6 rounded-pill transition-all relative",
                  settings.showLiabilities ? "bg-primary" : "bg-surface-strong"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all",
                  settings.showLiabilities ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* General Preferences Section */}
        <div className="card-xl space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h4 className="text-base font-normal text-ink uppercase tracking-tight">System Preferences</h4>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-muted">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Base Currency</p>
                  <p className="text-xs text-muted">Global audit symbol</p>
                </div>
              </div>
              <Select
                value={settings.currency}
                onChange={v => onUpdateSettings({...settings, currency: v})}
                options={[
                  { value: '৳', label: 'BDT (৳)' },
                  { value: '$', label: 'USD ($)' },
                  { value: '€', label: 'EUR (€)' },
                  { value: '£', label: 'GBP (£)' },
                  { value: '₹', label: 'INR (₹)' }
                ]}
                className="w-auto"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  settings.enableNotifications ? "bg-primary/5 text-primary" : "bg-surface-soft text-muted"
                )}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Audit Alerts</p>
                  <p className="text-xs text-muted">Real-time sync notifications</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('enableNotifications')}
                className={cn(
                  "w-12 h-6 rounded-pill transition-all relative",
                  settings.enableNotifications ? "bg-primary" : "bg-surface-strong"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all",
                  settings.enableNotifications ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  settings.darkMode ? "bg-surface-dark text-on-dark" : "bg-surface-soft text-muted"
                )}>
                  {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Dark Mode</p>
                  <p className="text-xs text-muted">Institutional dark theme</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('darkMode')}
                className={cn(
                  "w-12 h-6 rounded-pill transition-all relative",
                  settings.darkMode ? "bg-primary" : "bg-surface-strong"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all",
                  settings.darkMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-muted">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Font Size</p>
                  <p className="text-xs text-muted">Base text scaling</p>
                </div>
              </div>
              <Select
                value={settings.fontSize}
                onChange={v => onUpdateSettings({...settings, fontSize: v})}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'large', label: 'Large' }
                ]}
                className="w-auto"
              />
            </div>

          </div>
        </div>

        {/* Type Colors Section */}
        <div className="card-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <h4 className="text-base font-normal text-ink uppercase tracking-tight">Account Colors</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(settings.typeColors || {}).map(([type, color]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">{type.replace('_', ' ')}</span>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={e => onUpdateSettings({ ...settings, typeColors: { ...settings.typeColors, [type]: e.target.value } })}
                  className="w-8 h-8 rounded-lg border border-hairline cursor-pointer bg-transparent p-0.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="card-xl space-y-4">
          <div className="flex items-center gap-3">
            <Tags className="w-5 h-5 text-primary" />
            <h4 className="text-base font-normal text-ink uppercase tracking-tight">Categories</h4>
          </div>
          {categories.length === 0 ? (
            <p className="text-xs text-muted">No categories found.</p>
          ) : (
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between px-3 py-2 bg-surface-soft rounded-xl border border-hairline">
                  <span className="text-xs font-semibold text-ink">{cat}</span>
                  <button
                    type="button"
                    onClick={() => setRenameTarget(cat)}
                    className="p-1.5 text-muted hover:text-ink hover:bg-surface-strong rounded-full transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Management Section */}
        <div className="card-xl md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <h4 className="text-base font-normal text-ink uppercase tracking-tight">Data Governance</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={handleExport}
              className="p-4 bg-surface-soft border border-hairline rounded-xl text-left hover:bg-canvas hover:border-primary transition-all group"
            >
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
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="p-4 bg-surface-soft border border-hairline rounded-xl text-left hover:bg-canvas hover:border-primary transition-all group"
            >
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
            <button 
              onClick={handleClearAll}
              className="p-4 bg-semantic-down/5 border border-semantic-down/10 rounded-xl text-left hover:bg-semantic-down/10 transition-all group"
            >
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
      </div>

      <RenameModal
        open={!!renameTarget}
        title={`Rename "${renameTarget}"`}
        initialValue={renameTarget || ''}
        onConfirm={handleRenameCategory}
        onCancel={() => setRenameTarget(null)}
      />
    </div>
  );
}
