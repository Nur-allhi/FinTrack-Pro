import React from 'react';
import { Moon, Sun, Palette, Type } from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';

interface AppearanceSettingsProps {
  settings: {
    darkMode: boolean;
    darkModeStyle: string;
    fontSize: string;
    currency: string;
    accentColor: string;
    typeColors: Record<string, string>;
    showNetWorth: boolean;
    showCurrentAssets: boolean;
    showLiabilities: boolean;
    showTodos: boolean;
    showSpendingChart: boolean;
    showBalanceTrend: boolean;
    enableNotifications: boolean;
  };
  onUpdateSettings: (s: AppearanceSettingsProps['settings']) => void;
  toggleSetting: (key: string) => void;
}

export default function AppearanceSettings({ settings, onUpdateSettings, toggleSetting }: AppearanceSettingsProps) {
  return (
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
            {['#A78BFA', '#05b169', '#cf202f', '#f59e0b', '#8B5CF6', '#14B8A6', '#EC4899', '#F97316', '#13111C', '#64748B'].map(color => (
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
  );
}
