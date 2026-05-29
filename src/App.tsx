import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Layers,
  Settings as SettingsIcon,
  Shield,
  Handshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from './components/LoadingScreen';
import OfflineIndicator from './components/OfflineIndicator';
import UserProfile from './components/UserProfile';
import FloatingActionButton from './components/FloatingActionButton';
import ErrorBoundary from './components/ErrorBoundary';

import { Member, Account } from './types';
import { cacheService } from './services/cacheService';
import { authService, setOnSessionExpired } from './services/authService';
import { offlineService, syncState, initPendingCount } from './services/offlineService';
import { cn } from './utils/cn';
import { useToast } from './components/Toast';
import { Agentation } from 'agentation';

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
const LoanManager = lazy(() => import('./components/LoanManager'));
const TransferModal = lazy(() => import('./components/TransferModal'));
const TransactionModal = lazy(() => import('./components/TransactionModal'));
const Login = lazy(() => import('./components/Login'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'groups' | 'investments' | 'loans' | 'reports' | 'settings' | 'admin'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(offlineService.getLastSync());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingBalanceAdj, setPendingBalanceAdj] = useState<Record<number, number>>({});
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
  const [dataLoading, setDataLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchData = async (showToast = false) => {
    if (!offlineService.isOnline()) { if (showToast) toast("Cannot refresh while offline.", 'error'); return; }
    setDataLoading(true);
    setLastUpdate(Date.now());
    try {
      const cb = `?_=${Date.now()}`;
      const [membersRes, accountsRes] = await Promise.all([authService.apiFetch('/api/members' + cb), authService.apiFetch('/api/accounts' + cb)]);
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
    } finally {
      setDataLoading(false);
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
    const init = async () => {
      initPendingCount();
      const stored = localStorage.getItem('auth_token');
      if (stored) {
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          setIsAuthenticated(true);
          if (localStorage.getItem('is_admin') === '1') setIsAdmin(true);
          const savedTab = sessionStorage.getItem('activeTab');
          const savedAccountId = sessionStorage.getItem('selectedAccountId');
          if (savedTab) setActiveTab(savedTab as any);
          if (savedAccountId) setSelectedAccountId(Number(savedAccountId));
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_admin');
      setIsAuthenticated(false);
      setIsAdmin(false);
      toast("Session expired. Please sign in again.", 'error');
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStorage.setItem('activeTab', activeTab);
    if (selectedAccountId) {
      sessionStorage.setItem('selectedAccountId', String(selectedAccountId));
    } else {
      sessionStorage.removeItem('selectedAccountId');
    }
  }, [isAuthenticated, activeTab, selectedAccountId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    window.history.replaceState({ app: true }, '');
    window.history.pushState({ app: true }, '');
    const handlePopState = () => {
      window.history.pushState({ app: true }, '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (offlineService.isOnline()) fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleFocus = () => {
      if (offlineService.isOnline()) fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadFromCache();
    const checkAdmin = () => authService.apiFetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.email) setUserEmail(d.user.email);
      if (d.isAdmin) { setIsAdmin(true); localStorage.setItem('is_admin', '1'); }
      else { localStorage.removeItem('is_admin'); }
    }).catch((err) => {
      console.warn('Admin check failed, retrying in 3s:', err);
      setTimeout(checkAdmin, 3000);
    });
    checkAdmin();
    if (offlineService.isOnline()) {
      fetchData();
    } else {
      setIsOnline(false);
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const offCleanup = offlineService.onOffline(() => setIsOnline(false));
    const onCleanup = offlineService.onOnline(async () => {
      setIsOnline(true);
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      await fetchData();
      if (result.synced > 0) {
        const msg = result.failed > 0
          ? `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}, ${result.failed} failed.`
          : `Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`;
        toast(msg, result.failed > 0 ? 'error' : 'success');
      }
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

  useEffect(() => {
    const handleSWSync = async () => {
      if (!offlineService.isOnline()) return;
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      await fetchData();
      if (result.synced > 0) {
        toast(`Background synced ${result.synced} change${result.synced !== 1 ? 's' : ''}.`, result.failed > 0 ? 'error' : 'success');
      }
    };
    window.addEventListener('sw-sync-offline', handleSWSync);
    return () => window.removeEventListener('sw-sync-offline', handleSWSync);
  }, []);

  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setPendingCount(s.pendingCount);
      setIsSyncing(s.state === 'syncing');
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (pendingCount === 0) { setPendingBalanceAdj({}); return; }
    offlineService.getQueue().then(queue => {
      const adj: Record<number, number> = {};
      for (const a of queue) {
        if (a.type === 'create' && a.endpoint === '/api/transactions' && a.body?.account_id && typeof a.body.amount === 'number') {
          adj[a.body.account_id] = (adj[a.body.account_id] || 0) + a.body.amount;
        } else if (a.type === 'delete' && a.body?.account_id && typeof a.body.amount === 'number') {
          adj[a.body.account_id] = (adj[a.body.account_id] || 0) - a.body.amount;
        }
      }
      setPendingBalanceAdj(adj);
    });
  }, [pendingCount]);

  const adjustedAccounts = useMemo(() =>
    accounts.map(a => ({
      ...a, current_balance: a.current_balance + (pendingBalanceAdj[a.id] || 0)
    })),
    [accounts, pendingBalanceAdj]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      if (!offlineService.isOnline()) return;
      const state = syncState.get();
      if (state.pendingCount === 0 || state.state === 'syncing') return;
      console.log('[sync-poller] found pending items, running sync');
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      if (result.synced > 0) {
        await fetchData();
        toast(
          result.failed > 0
            ? `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}, ${result.failed} failed.`
            : `Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`,
          result.failed > 0 ? 'error' : 'success'
        );
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
    setDataLoading(true);
    toast("Login successful.", 'success');
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
    { id: 'loans', label: 'Loans', icon: Handshake },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin Panel', icon: Shield }] : []),
  ];

  const renderContent = () => {
    if (showProfile) {
      return <UserProfile userEmail={userEmail} onRefreshData={() => fetchData(true)} onExportData={handleExportData} onClearCache={handleClearCache} />;
    }
    if (selectedAccountId) {
      const account = adjustedAccounts.find(a => a.id === selectedAccountId);
      if (!account) return <div className="p-8 text-center text-muted">Account not found</div>;
      return <Ledger account={account} onBack={() => setSelectedAccountId(null)} onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard accounts={adjustedAccounts} members={members} filterMemberId={dashboardFilter} setFilterMemberId={setDashboardFilter} onSelectAccount={setSelectedAccountId} onOpenTransfer={() => setIsTransferModalOpen(true)} onOpenTransaction={() => setIsTransactionModalOpen(true)} onGenerateReport={() => setActiveTab('reports')} settings={settings} userName={localStorage.getItem('user_name') || ''} dataLoading={dataLoading} />;
      case 'members': return <MemberManager members={members} accounts={adjustedAccounts} onUpdate={fetchData} onSelectAccount={setSelectedAccountId} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'accounts': return <AccountManager accounts={adjustedAccounts} members={members} onUpdate={fetchData} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'groups': return <GroupManager onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
      case 'investments': return <InvestmentTracker accounts={adjustedAccounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'loans': return <LoanManager accounts={adjustedAccounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'reports': return <ReportGenerator accounts={adjustedAccounts} members={members} currency={settings.currency} />;
      case 'admin': return <AdminPanel />;
      case 'settings': return <Settings settings={settings as any} onUpdateSettings={(s: any) => { setSettings(s); cacheService.setSettings(s); }} />;
      default: return null;
    }
  };

  if (isAuthenticated === null) return <LoadingScreen fullScreen />;
  if (!isAuthenticated) return <Suspense fallback={null}><Login onLogin={handleLogin} /></Suspense>;

  return (
    <><div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        settings={settings} onLogout={handleLogout} navItems={navItems}
        userEmail={userEmail} showProfile={showProfile} onOpenProfile={() => { setShowProfile(true); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} setShowProfile={setShowProfile}
      />

      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          selectedAccountId={selectedAccountId} 
          activeTabLabel={navItems.find(i => i.id === activeTab)?.label}
          accounts={adjustedAccounts}
          members={members}
          onSearchSelect={(type, id) => {
            if (type === 'account') { setSelectedAccountId(id); }
            else { setActiveTab('dashboard'); setDashboardFilter(id); }
          }}
        />

        <OfflineIndicator isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} lastSyncAt={lastSync} />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={showProfile ? 'profile' : selectedAccountId || activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<LoadingScreen />}>{renderContent()}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ErrorBoundary>
        {isTransferModalOpen && (
          <Suspense fallback={null}>
            <TransferModal accounts={adjustedAccounts} onClose={() => setIsTransferModalOpen(false)} onUpdate={fetchData} currency={settings.currency} />
          </Suspense>
        )}
        {isTransactionModalOpen && (
          <Suspense fallback={null}>
            <TransactionModal accounts={adjustedAccounts} onClose={() => setIsTransactionModalOpen(false)} onUpdate={fetchData} initialAccountId={selectedAccountId || undefined} currency={settings.currency} />
          </Suspense>
        )}
      </ErrorBoundary>
      <div className="md:hidden"><FloatingActionButton onNewTransaction={() => setIsTransactionModalOpen(true)} onNewTransfer={() => setIsTransferModalOpen(true)} isTransactionModalOpen={isTransactionModalOpen} isTransferModalOpen={isTransferModalOpen} /></div>
    </div>
      {import.meta.env.VITE_AGENTATION === 'true' && <Agentation />}
    </>
  );
}
