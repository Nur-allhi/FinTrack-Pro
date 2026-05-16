import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Layers,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from './components/LoadingScreen';
import OfflineIndicator from './components/OfflineIndicator';
import UserProfile from './components/UserProfile';

import { Member, Account } from './types';
import { cacheService } from './services/cacheService';
import { authService } from './services/authService';
import { offlineService } from './services/offlineService';
import { cn } from './utils/cn';
import { useToast } from './components/Toast';

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
const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'groups' | 'investments' | 'reports' | 'settings' | 'admin'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(offlineService.getLastSync());
  const [userEmail, setUserEmail] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const defaultTypeColors: Record<string, string> = {
    cash: '#10B981', bank: '#0052FF', mobile: '#8B5CF6',
    investment: '#F59E0B', purpose: '#EC4899', home_exp: '#EF4444',
  };

  const [settings, setSettings] = useState({
    showNetWorth: true,
    showCurrentAssets: true,
    showLiabilities: true,
    showTodos: true,
    enableNotifications: true,
    darkMode: false,
    darkModeStyle: 'dark',
    fontSize: 'normal',
    currency: '৳',
    typeColors: { ...defaultTypeColors },
    accentColor: '#0052FF'
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchData = async (showToast = false) => {
    if (!offlineService.isOnline()) { if (showToast) toast("Cannot refresh while offline.", 'error'); return; }
    setLastUpdate(Date.now());
    try {
      const [membersRes, accountsRes] = await Promise.all([authService.apiFetch('/api/members'), authService.apiFetch('/api/accounts')]);
      if (!membersRes.ok || !accountsRes.ok) throw new Error("Server error");
      const membersData = await membersRes.json();
      const accountsData = await accountsRes.json();
      setMembers(membersData);
      setAccounts(accountsData);
      cacheService.setMembers(membersData);
      cacheService.setAccounts(accountsData);
      setLastSync(Date.now());
      offlineService.setLastSync();
      if (showToast) toast("Data refreshed.", 'success');
    } catch (error) {
      console.error("Fetch failed:", error);
      if (showToast) toast("Failed to refresh data.", 'error');
    }
  };

  const loadFromCache = async () => {
    const [cachedMembers, cachedAccounts, cachedSettings] = await Promise.all([
      cacheService.getMembers(), cacheService.getAccounts(), cacheService.getSettings()
    ]);
    if (cachedMembers) setMembers(cachedMembers);
    if (cachedAccounts) setAccounts(cachedAccounts);
    if (cachedSettings) {
      const darkStyle = (['dark', 'dark-dim', 'dark-night'].includes(cachedSettings.darkModeStyle) ? cachedSettings.darkModeStyle : 'dark') as 'dark' | 'dark-dim' | 'dark-night';
      setSettings({ ...cachedSettings, accentColor: cachedSettings.accentColor || '#0052FF', darkModeStyle: darkStyle, typeColors: { ...defaultTypeColors, ...(cachedSettings.typeColors || {}) } });
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      setIsAuthenticated(true);
      if (localStorage.getItem('is_admin') === '1') setIsAdmin(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadFromCache();
    authService.apiFetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.email) setUserEmail(d.user.email);
      if (d.isAdmin) { setIsAdmin(true); localStorage.setItem('is_admin', '1'); }
      else { localStorage.removeItem('is_admin'); }
    }).catch(() => {});
    if (offlineService.isOnline()) {
      fetchData();
    } else {
      setIsOnline(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const offCleanup = offlineService.onOffline(() => setIsOnline(false));
    const onCleanup = offlineService.onOnline(() => {
      setIsOnline(true);
      setLastSync(Date.now());
      fetchData();
      offlineService.syncQueue(authService.apiFetch).then(result => {
        if (result.synced > 0) {
          toast(`Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`, 'success');
        }
      });
    });
    return () => { offCleanup(); onCleanup(); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'dark-dim', 'dark-night');
    if (settings.darkMode) {
      document.documentElement.classList.add(settings.darkModeStyle);
    }
    localStorage.setItem('fintrack_dark', settings.darkMode ? '1' : '0');
    localStorage.setItem('fintrack_dark_style', settings.darkMode ? settings.darkModeStyle : '');
  }, [settings.darkMode, settings.darkModeStyle]);

  useEffect(() => {
    const hex = settings.accentColor;
    document.documentElement.style.setProperty('--color-primary', hex);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const darken = (c: number) => Math.max(0, c - 25);
    const lighten = (c: number) => Math.min(255, c + 40);
    const active = `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
    const disabled = `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`;
    document.documentElement.style.setProperty('--color-primary-active', active);
    document.documentElement.style.setProperty('--color-primary-disabled', disabled);
  }, [settings.accentColor]);

  useEffect(() => {
    const sizes: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
  }, [settings.fontSize]);

  useEffect(() => {
    setShowProfile(false);
  }, [activeTab]);

  const handleLogin = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
    loadFromCache().catch(() => {});
    fetchData().catch(() => {});
  };

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    setIsAuthenticated(false);
    setIsAdmin(false);
    await authService.signOut();
  };

  const handleExportData = async () => {
    const blob = new Blob([JSON.stringify({ members, accounts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleClearCache = async () => {
    if (confirm("Clear cache?")) { await cacheService.clearCache(); window.location.reload(); }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin Panel', icon: Shield }] : []),
  ];

  const renderContent = () => {
    if (showProfile) {
      return <UserProfile userEmail={userEmail} onRefreshData={() => fetchData(true)} onExportData={handleExportData} onClearCache={handleClearCache} />;
    }
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) return <div className="p-8 text-center text-muted">Account not found</div>;
      return <Ledger account={account} onBack={() => setSelectedAccountId(null)} onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard accounts={accounts} members={members} filterMemberId={dashboardFilter} setFilterMemberId={setDashboardFilter} onSelectAccount={setSelectedAccountId} onOpenTransfer={() => setIsTransferModalOpen(true)} onOpenTransaction={() => setIsTransactionModalOpen(true)} onGenerateReport={() => setActiveTab('reports')} settings={settings} userName={localStorage.getItem('user_name') || ''} />;
      case 'members': return <MemberManager members={members} accounts={accounts} onUpdate={fetchData} onSelectAccount={setSelectedAccountId} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'accounts': return <AccountManager accounts={accounts} members={members} onUpdate={fetchData} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'groups': return <GroupManager onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
      case 'investments': return <InvestmentTracker accounts={accounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'reports': return <ReportGenerator accounts={accounts} members={members} currency={settings.currency} />;
      case 'admin': return <AdminPanel />;
      case 'settings': return <Settings settings={settings as any} onUpdateSettings={(s: any) => { setSettings(s); cacheService.setSettings(s); }} />;
      default: return null;
    }
  };

  if (isAuthenticated === null) return <LoadingScreen fullScreen />;
  if (!isAuthenticated) return <Suspense fallback={null}><Login onLogin={handleLogin} /></Suspense>;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        settings={settings} onLogout={handleLogout} navItems={navItems}
        userEmail={userEmail} onOpenProfile={() => { setShowProfile(true); setSelectedAccountId(null); setIsMobileMenuOpen(false); }}
      />

      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
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

        <OfflineIndicator isOnline={isOnline} />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={showProfile ? 'profile' : selectedAccountId || activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<LoadingScreen />}>{renderContent()}</Suspense>
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
