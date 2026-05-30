import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '../utils/cn';

interface DashboardSettingsProps {
  settings: {
    showNetWorth: boolean;
    showCurrentAssets: boolean;
    showLiabilities: boolean;
    showTodos: boolean;
  };
  toggleSetting: (key: string) => void;
}

export default function DashboardSettings({ settings, toggleSetting }: DashboardSettingsProps) {
  return (
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
  );
}
