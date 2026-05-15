import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Layers,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Member, Account } from './types';
import { cacheService } from './services/cacheService';
import { cn } from './utils/cn';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Lazy Components
const Dashboard = lazy(() => import('./components/Dashboard'));
const MemberManager = lazy(() => import('./components/MemberManager'));
const AccountManager = lazy(() => import('./components/AccountManager'));
const Ledger = lazy(() => import('./components/Ledger'));
const InvestmentTracker = lazy(() => import('./components/InvestmentTracker'));
const ReportGenerator = lazy(() => import('./components/ReportGenerator'));
const Settings = lazy(() => import('./components/Settings'));
const GroupManager = lazy(() => import('./components/GroupManager'));
const TransferModal = lazy(() => import('./components/TransferModal'));
const TransactionModal = lazy(() => import('./components/TransactionModal'));
const FloatingActionButton = lazy(() => import('./components/FloatingActionButton'));
const Login = lazy(() => import('./components/Login'));

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'groups' | 'investments' | 'reports' | 'settings'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const defaultTypeColors: Record<string, string> = {
    cash: '#10B981', bank: '#0052FF', mobile: '#8B5CF6',
    investment: '#F59E0B', purpose: '#EC4899', home_exp: '#EF4444',
  };

  const [settings, setSettings] = useState({
    showNetWorth: true,
    showCurrentAssets: true,
    showLiabilities: true,
    enableNotifications: true,
    darkMode: false,
    fontSize: 'normal',
    currency: '৳',
    typeColors: { ...defaultTypeColors }
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    const sizes: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
  }, [settings.fontSize]);



  const handleLogin = (token: string, rememberMe: boolean) => {
    if (rememberMe) localStorage.setItem('auth_token', token);
    else sessionStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  const fetchData = async () => {
    setLastUpdate(Date.now());
    try {
      const [membersRes, accountsRes] = await Promise.all([fetch('/api/members'), fetch('/api/accounts')]);
      if (!membersRes.ok || !accountsRes.ok) throw new Error("Server error");
      const membersData = await membersRes.json();
      const accountsData = await accountsRes.json();
      setMembers(membersData);
      setAccounts(accountsData);
      cacheService.setMembers(membersData);
      cacheService.setAccounts(accountsData);
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  };

  useEffect(() => {
    const loadCache = async () => {
      const [cachedMembers, cachedAccounts, cachedSettings] = await Promise.all([
        cacheService.getMembers(), cacheService.getAccounts(), cacheService.getSettings()
      ]);
      if (cachedMembers) setMembers(cachedMembers);
      if (cachedAccounts) setAccounts(cachedAccounts);
      if (cachedSettings) setSettings({ ...cachedSettings, typeColors: { ...defaultTypeColors, ...(cachedSettings.typeColors || {}) } });
      fetchData();
    };
    loadCache();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) return <div className="p-8 text-center text-muted">Account not found</div>;
      return <Ledger account={account} onBack={() => setSelectedAccountId(null)} onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard accounts={accounts} members={members} filterMemberId={dashboardFilter} setFilterMemberId={setDashboardFilter} onSelectAccount={setSelectedAccountId} onOpenTransfer={() => setIsTransferModalOpen(true)} onOpenTransaction={() => setIsTransactionModalOpen(true)} onGenerateReport={() => setActiveTab('reports')} settings={settings} />;
      case 'members': return <MemberManager members={members} accounts={accounts} onUpdate={fetchData} onSelectAccount={setSelectedAccountId} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'accounts': return <AccountManager accounts={accounts} members={members} onUpdate={fetchData} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'groups': return <GroupManager onUpdate={fetchData} currency={settings.currency} />;
      case 'investments': return <InvestmentTracker accounts={accounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'reports': return <ReportGenerator accounts={accounts} members={members} currency={settings.currency} />;
      case 'settings': return <Settings settings={settings} onUpdateSettings={(s: any) => { setSettings(s); cacheService.setSettings(s); }} onExportData={async () => { const blob = new Blob([JSON.stringify({ members, accounts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }} onClearCache={async () => { if (confirm("Clear cache?")) { await cacheService.clearCache(); window.location.reload(); } }} />;
      default: return null;
    }
  };

  if (isAuthenticated === null) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Suspense fallback={null}><Login onLogin={handleLogin} /></Suspense>;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        accounts={accounts} settings={settings} onLogout={handleLogout} navItems={navItems}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          selectedAccountId={selectedAccountId} 
          activeTabLabel={navItems.find(i => i.id === activeTab)?.label}
          accounts={accounts}
          members={members}
          onSearchSelect={(type, id) => {
            if (type === 'account') { setSelectedAccountId(id); }
            else { setActiveTab('dashboard'); setDashboardFilter(id); }
          }}
        />

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={selectedAccountId || activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<div>Loading...</div>}>{renderContent()}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Suspense fallback={null}>
        {isTransferModalOpen && <TransferModal accounts={accounts} onClose={() => setIsTransferModalOpen(false)} onUpdate={fetchData} currency={settings.currency} />}
        {isTransactionModalOpen && <TransactionModal accounts={accounts} onClose={() => setIsTransactionModalOpen(false)} onUpdate={fetchData} initialAccountId={selectedAccountId || undefined} currency={settings.currency} />}
        <div className="md:hidden"><FloatingActionButton onNewTransaction={() => setIsTransactionModalOpen(true)} onNewTransfer={() => setIsTransferModalOpen(true)} isTransactionModalOpen={isTransactionModalOpen} isTransferModalOpen={isTransferModalOpen} /></div>
      </Suspense>
    </div>
  );
}
