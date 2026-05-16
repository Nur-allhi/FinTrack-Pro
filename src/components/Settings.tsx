import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  Moon,
  Sun,
  Type,
  Pencil,
  Tags,
  Palette,
} from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';
import RenameModal from './RenameModal';
import { authService } from '../services/authService';

interface AppSettings {
  showNetWorth: boolean;
  showCurrentAssets: boolean;
  showLiabilities: boolean;
  showTodos: boolean;
  enableNotifications: boolean;
  darkMode: boolean;
  darkModeStyle: 'dark' | 'dark-dim' | 'dark-night';
  fontSize: string;
  currency: string;
  typeColors: Record<string, string>;
  accentColor: string;
}

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function Settings({ settings, onUpdateSettings }: SettingsProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'appearance' | 'dashboard' | 'categories'>('appearance');

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
    } catch {
      console.error('Failed to rename category.');
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

      {/* Section Nav */}
      <div className="flex md:hidden gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
        {(['appearance', 'dashboard', 'categories'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={cn("shrink-0 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              activeSection === s ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted hover:text-ink'
            )}
          >
            {s === 'appearance' ? 'Appearance' : s === 'dashboard' ? 'Dashboard' : 'Categories'}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar nav */}
        <div className="hidden md:flex flex-col gap-1 w-44 shrink-0">
          {([
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'dashboard', label: 'Dashboard', icon: Eye },
            { id: 'categories', label: 'Categories', icon: Tags },
          ] as const).map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id as typeof activeSection)}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  active ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface-soft hover:text-ink'
                )}
              >
                <Icon className={cn("w-4 h-4", active ? 'text-white' : 'text-muted')} />
                <span className="text-sm font-semibold">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <div className="card-xl space-y-5">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-normal text-ink uppercase tracking-tight">Theme</h4>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        settings.darkMode ? "bg-surface-dark text-on-dark" : "bg-surface-soft text-muted"
                      )}>
                        {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Dark Mode</p>
                        <p className="text-xs text-muted">Institutional dark theme</p>
                      </div>
                    </div>
                    <button onClick={() => toggleSetting('darkMode')}
                      className={cn("w-12 h-6 rounded-pill transition-all relative", settings.darkMode ? "bg-primary" : "bg-surface-strong")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all", settings.darkMode ? "left-7" : "left-1")} />
                    </button>
                  </div>
                  {settings.darkMode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">Theme Style</span>
                      <div className="flex items-center gap-1 bg-surface-strong p-0.5 rounded-pill border border-hairline">
                        {(['dark', 'dark-dim', 'dark-night'] as const).map(style => (
                          <button key={style} onClick={() => onUpdateSettings({ ...settings, darkModeStyle: style })}
                            className={cn("px-3 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all",
                              settings.darkModeStyle === style ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink'
                            )}
                          >{style === 'dark' ? 'Deep' : style === 'dark-dim' ? 'Dim' : 'Night'}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-xl space-y-4">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-normal text-ink uppercase tracking-tight">Accent Color</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-hairline">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">Primary</span>
                    <input type="color" value={settings.accentColor}
                      onChange={e => onUpdateSettings({ ...settings, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-hairline cursor-pointer bg-transparent p-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['#0052FF', '#05b169', '#cf202f', '#f59e0b', '#8B5CF6', '#14B8A6', '#EC4899', '#F97316', '#0A0B0D', '#64748B'].map(color => (
                      <button key={color} type="button" onClick={() => onUpdateSettings({ ...settings, accentColor: color })}
                        className={`w-8 h-8 rounded-full transition-all border-2 ${settings.accentColor === color ? 'border-ink scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="card-xl space-y-5">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-normal text-ink uppercase tracking-tight">Text</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Font Size</p>
                    <p className="text-xs text-muted">Base text scaling</p>
                  </div>
                  <Select value={settings.fontSize}
                    onChange={v => onUpdateSettings({...settings, fontSize: v})}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'large', label: 'Large' }
                    ]} className="w-auto" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Base Currency</p>
                    <p className="text-xs text-muted">Global audit symbol</p>
                  </div>
                  <Select value={settings.currency}
                    onChange={v => onUpdateSettings({...settings, currency: v})}
                    options={[
                      { value: '৳', label: 'BDT (৳)' }, { value: '$', label: 'USD ($)' },
                      { value: '€', label: 'EUR (€)' }, { value: '£', label: 'GBP (£)' },
                      { value: '₹', label: 'INR (₹)' }
                    ]} className="w-auto" />
                </div>
              </div>

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
                      <input type="color" value={color}
                        onChange={e => onUpdateSettings({ ...settings, typeColors: { ...settings.typeColors, [type]: e.target.value } })}
                        className="w-8 h-8 rounded-lg border border-hairline cursor-pointer bg-transparent p-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <div className="card-xl space-y-5">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <h4 className="text-base font-normal text-ink uppercase tracking-tight">Dashboard Banner</h4>
              </div>
              <div className="space-y-5">
                {([
                  { key: 'showNetWorth' as const, label: 'Total Balance', desc: 'Hero summary visibility' },
                  { key: 'showCurrentAssets' as const, label: 'Liquid Assets', desc: 'Primary asset card visibility' },
                  { key: 'showLiabilities' as const, label: 'Total Liabilities', desc: 'Debt summary visibility' },
                  { key: 'showTodos' as const, label: 'Quick Tasks', desc: 'Todo widget visibility' },
                ]).map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        settings[item.key] ? "bg-primary/5 text-primary" : "bg-surface-soft text-muted"
                      )}>
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.label}</p>
                        <p className="text-xs text-muted">{item.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleSetting(item.key)}
                      className={cn("w-12 h-6 rounded-pill transition-all relative", settings[item.key] ? "bg-primary" : "bg-surface-strong")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-canvas rounded-full transition-all", settings[item.key] ? "left-7" : "left-1")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className="card-xl space-y-4">
              <div className="flex items-center gap-3">
                <Tags className="w-5 h-5 text-primary" />
                <h4 className="text-base font-normal text-ink uppercase tracking-tight">Categories</h4>
              </div>
              {categories.length === 0 ? (
                <p className="text-xs text-muted">No categories found.</p>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between px-3 py-2 bg-surface-soft rounded-xl border border-hairline">
                      <span className="text-xs font-semibold text-ink">{cat}</span>
                      <button type="button" onClick={() => setRenameTarget(cat)}
                        className="p-1.5 text-muted hover:text-ink hover:bg-surface-strong rounded-full transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
