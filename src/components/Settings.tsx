import React from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  EyeOff, 
  Bell, 
  Moon, 
  Globe, 
  ShieldCheck,
  Smartphone,
  Database
} from 'lucide-react';

interface AppSettings {
  showNetWorth: boolean;
  showCurrentAssets: boolean;
  showLiabilities: boolean;
  enableNotifications: boolean;
  darkMode: boolean;
  currency: string;
}

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onClearCache: () => void;
}

export default function Settings({ settings, onUpdateSettings, onExportData, onClearCache }: SettingsProps) {
  const toggleSetting = (key: keyof AppSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key as any]
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({
      ...settings,
      currency: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <SettingsIcon className="text-primary w-6 h-6" />
        </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">App Settings</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Customize your experience and dashboard visibility.</p>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dashboard Visibility Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Dashboard Visibility</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {settings.showNetWorth ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Show Net Worth</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Display total balance card</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showNetWorth')}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.showNetWorth ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showNetWorth ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {settings.showCurrentAssets ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Show Current Assets</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Display liquid assets card</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showCurrentAssets')}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.showCurrentAssets ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showCurrentAssets ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {settings.showLiabilities ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Show Liabilities</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Display total debt card</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('showLiabilities')}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.showLiabilities ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showLiabilities ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* General Preferences Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100">General Preferences</h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Currency Symbol</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select your local currency</p>
                </div>
              </div>
              <select 
                value={settings.currency}
                onChange={handleCurrencyChange}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="৳">BDT (৳)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="₹">INR (₹)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Alerts for large transactions</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('enableNotifications')}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.enableNotifications ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableNotifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dark Mode</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Switch to dark theme</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('darkMode')}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.darkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.darkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Data Management</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={onExportData}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
            >
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">Export All Data</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download your financial history as JSON</p>
            </button>
            <button 
              onClick={onClearCache}
              className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl text-left hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all group"
            >
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Clear Local Cache</p>
              <p className="text-xs text-rose-400 dark:text-rose-500">Reset app state and refetch from server</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
