import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Eye, Palette, Tags, PiggyBank, Repeat } from 'lucide-react';
import { cn } from '../utils/cn';
import RenameModal from './RenameModal';
import { authService } from '../services/authService';
import AppearanceSettings from './AppearanceSettings';
import DashboardSettings from './DashboardSettings';
import CategorySettings from './CategorySettings';
import BudgetManager from './BudgetManager';
import RecurringManager from './RecurringManager';

interface AppSettings {
  showNetWorth: boolean;
  showCurrentAssets: boolean;
  showLiabilities: boolean;
  showTodos: boolean;
  showSpendingChart: boolean;
  showBalanceTrend: boolean;
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
  const [activeSection, setActiveSection] = useState<'appearance' | 'dashboard' | 'categories' | 'budgets' | 'recurring'>('appearance');
  const [settingsAccounts, setSettingsAccounts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    authService.apiFetch('/api/accounts')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSettingsAccounts(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    authService.apiFetch('/api/transactions/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCategories(data); })
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

  const toggleSetting = (key: string) => {
    const value = settings[key as keyof AppSettings];
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

      <div className="flex md:hidden gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
        {(['appearance', 'dashboard', 'categories', 'budgets', 'recurring'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={cn("shrink-0 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              activeSection === s ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted hover:text-ink'
            )}
          >
            {s === 'appearance' ? 'Appearance' : s === 'dashboard' ? 'Dashboard' : s === 'categories' ? 'Categories' : s === 'budgets' ? 'Budgets' : 'Recurring'}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="hidden md:flex flex-col gap-1 w-44 shrink-0">
          {([
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'dashboard', label: 'Dashboard', icon: Eye },
            { id: 'categories', label: 'Categories', icon: Tags },
            { id: 'budgets', label: 'Budgets', icon: PiggyBank },
            { id: 'recurring', label: 'Recurring', icon: Repeat },
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

        <div className="flex-1 min-w-0">
          {activeSection === 'appearance' && (
            <AppearanceSettings settings={settings} onUpdateSettings={onUpdateSettings} toggleSetting={toggleSetting} />
          )}
          {activeSection === 'dashboard' && (
            <DashboardSettings settings={settings} toggleSetting={toggleSetting} />
          )}
          {activeSection === 'categories' && (
            <CategorySettings categories={categories} onRename={(cat) => setRenameTarget(cat)} />
          )}
          {activeSection === 'budgets' && (
            <BudgetManager currency={settings.currency} categories={categories} />
          )}
          {activeSection === 'recurring' && (
            <RecurringManager accounts={settingsAccounts} currency={settings.currency} />
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
