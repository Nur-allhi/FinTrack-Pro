import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import Dashboard from './components/Dashboard';
import MemberManager from './components/MemberManager';
import AccountManager from './components/AccountManager';
import Ledger from './components/Ledger';
import InvestmentTracker from './components/InvestmentTracker';
import ReportGenerator from './components/ReportGenerator';
import Settings from './components/Settings';
import TransferModal from './components/TransferModal';
import TransactionModal from './components/TransactionModal';
import FloatingActionButton from './components/FloatingActionButton';

import { Member, Account } from './types';
import { cacheService } from './services/cacheService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'investments' | 'reports' | 'settings'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [settings, setSettings] = useState({
    showNetWorth: true,
    showCurrentAssets: true,
    showLiabilities: true,
    enableNotifications: true,
    darkMode: false,
    currency: '৳'
  });

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    cacheService.setSettings(newSettings);
  };

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleExportData = async () => {
    try {
      const exportData = {
        members,
        accounts,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  };

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear the local cache? This will reset your settings and refetch all data from the server.")) {
      await cacheService.clearCache();
      window.location.reload();
    }
  };

  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchData = async () => {
    // Trigger immediate refresh for dependent components (like Ledger)
    setLastUpdate(Date.now());
    
    try {
      const [membersRes, accountsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/accounts')
      ]);
      if (!membersRes.ok || !accountsRes.ok) {
        throw new Error(`Server error: ${membersRes.status} ${accountsRes.status}`);
      }
      const membersData = await membersRes.json();
      const accountsData = await accountsRes.json();
      
      setMembers(membersData);
      setAccounts(accountsData);
      setLastUpdate(Date.now());
      
      // Update cache in background
      cacheService.setMembers(membersData);
      cacheService.setAccounts(accountsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    // Load from cache first for instant UI
    const loadCache = async () => {
      const [cachedMembers, cachedAccounts, cachedSettings] = await Promise.all([
        cacheService.getMembers(),
        cacheService.getAccounts(),
        cacheService.getSettings()
      ]);
      
      if (cachedMembers) setMembers(cachedMembers);
      if (cachedAccounts) setAccounts(cachedAccounts);
      if (cachedSettings) setSettings(cachedSettings);
      
      // Then fetch fresh data
      fetchData();
    };
    
    loadCache();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) {
        return (
          <div className="p-8 text-center">
            <p className="text-slate-500">Account not found or loading...</p>
            <button onClick={() => setSelectedAccountId(null)} className="mt-4 text-primary font-bold">
              Go Back
            </button>
          </div>
        );
      }
      return (
        <Ledger 
          account={account} 
          onBack={() => setSelectedAccountId(null)} 
          onUpdate={fetchData}
          lastUpdate={lastUpdate}
          currency={settings.currency}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            accounts={accounts} 
            members={members} 
            filterMemberId={dashboardFilter}
            setFilterMemberId={setDashboardFilter}
            onSelectAccount={setSelectedAccountId}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
            settings={settings}
          />
        );
      case 'members':
        return <MemberManager members={members} onUpdate={fetchData} />;
      case 'accounts':
        return <AccountManager accounts={accounts} members={members} onUpdate={fetchData} currency={settings.currency} />;
      case 'investments':
        return <InvestmentTracker accounts={accounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'reports':
        return <ReportGenerator accounts={accounts} members={members} currency={settings.currency} />;
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            onUpdateSettings={updateSettings} 
            onExportData={handleExportData}
            onClearCache={handleClearCache}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar / Mobile Nav */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-primary tracking-tight">FinTrack Pro</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedAccountId(null);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  activeTab === item.id && !selectedAccountId
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Net Worth</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 financial-number">
                {settings.currency}{accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {selectedAccountId ? 'Account Ledger' : navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 dark:bg-accent/5 text-primary border border-accent/20 dark:border-accent/10 rounded-lg hover:bg-accent/20 dark:hover:bg-accent/10 transition-colors font-medium text-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Transfer</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
              JD
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAccountId || activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isTransferModalOpen && (
        <TransferModal 
          accounts={accounts} 
          onClose={() => setIsTransferModalOpen(false)} 
          onUpdate={fetchData}
          currency={settings.currency}
        />
      )}

      {isTransactionModalOpen && (
        <TransactionModal 
          accounts={accounts}
          onClose={() => setIsTransactionModalOpen(false)}
          onUpdate={fetchData}
          initialAccountId={selectedAccountId || undefined}
          currency={settings.currency}
        />
      )}

      <FloatingActionButton 
        onNewTransaction={() => setIsTransactionModalOpen(true)}
        onNewTransfer={() => setIsTransferModalOpen(true)}
      />
    </div>
  );
}
