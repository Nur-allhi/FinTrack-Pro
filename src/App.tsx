import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Layers,
  Settings as SettingsIcon,
  Handshake,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from './components/LoadingScreen';
import UserProfile from './components/UserProfile';
import BottomNav from './components/layout/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

import { localDb } from './services/localDb';
import { authService } from './services/authService';
import { syncNow, startSyncScheduler, stopSyncScheduler } from './services/syncEngine';

// Debug: expose localDb for console queries
(window as any).__localDb = localDb;
import { useToast } from './components/Toast';
import { Agentation } from 'agentation';
import type { WriteOperation } from './types';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { useAuth } from './hooks/useAuth';
import { useThemeEffects } from './hooks/useThemeEffects';
import { useLocalData } from './hooks/useLocalData';
import { useScrollDirection } from './hooks/useScrollDirection';

const Dashboard = lazy(() => import('./components/Dashboard'));
const MemberManager = lazy(() => import('./components/MemberManager'));
const AccountManager = lazy(() => import('./components/AccountManager'));
const Ledger = lazy(() => import('./components/Ledger'));
const InvestmentTracker = lazy(() => import('./components/InvestmentTracker'));
const ReportGenerator = lazy(() => import('./components/ReportGenerator'));
const Settings = lazy(() => import('./components/Settings'));
const GroupManager = lazy(() => import('./components/GroupManager'));
const LoanManager = lazy(() => import('./components/LoanManager'));
const RecycleBin = lazy(() => import('./components/RecycleBin'));
const WriteModal = lazy(() => import('./components/WriteModal'));
const SignupNudge = lazy(() => import('./components/SignupNudge'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));

const defaultTypeColors: Record<string, string> = {
  cash: '#10B981', bank: '#A78BFA', mobile: '#8B5CF6',
  investment: '#F59E0B', purpose: '#EC4899', home_exp: '#EF4444',
};

const defaultSettings = {
  showNetWorth: false,
  showCurrentAssets: false,
  showLiabilities: false,
  showTodos: false,
  showSpendingChart: false,
  showBalanceTrend: false,
  enableNotifications: true,
  darkMode: false,
  darkModeStyle: 'dark' as 'dark' | 'dark-dim' | 'dark-night',
  fontSize: 'normal',
  currency: '৳',
  typeColors: { ...defaultTypeColors },
  accentColor: '#A78BFA'
};

export default function App() {
  const { toast } = useToast();
  const { isAuthenticated, authStatus, userEmail, handleLogin, handleContinueAsGuest, handleLogout } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'groups' | 'investments' | 'loans' | 'reports' | 'settings' | 'recyclebin'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>(() => {
    const saved = localStorage.getItem('dashboardFilter');
    if (saved === null) return 'all';
    if (saved === 'all' || saved === 'general') return saved;
    const num = Number(saved);
    return !isNaN(num) ? num : 'all';
  });
  const [writeOperation, setWriteOperation] = useState<WriteOperation | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const prevNavRef = useRef<{ tab: typeof activeTab; accountId: number | null } | null>(null);

  const { isOnline, lastSync, pendingCount, isSyncing, syncProgress, members, accounts, dataLoading, lastUpdate, fetchData, reloadFromLocal } = useLocalData(isAuthenticated);
  const { visible: navVisible, scrollRef } = useScrollDirection();
  useThemeEffects(settings);

  useEffect(() => {
    if (!isAuthenticated) return;
    const savedTab = sessionStorage.getItem('activeTab');
    const savedAccountId = sessionStorage.getItem('selectedAccountId');
    if (savedTab) setActiveTab(savedTab as typeof activeTab);
    if (savedAccountId) setSelectedAccountId(Number(savedAccountId));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStorage.setItem('activeTab', activeTab);
    if (selectedAccountId) {
      sessionStorage.setItem('selectedAccountId', String(selectedAccountId));
    } else {
      sessionStorage.removeItem('selectedAccountId');
    }
    localStorage.setItem('dashboardFilter', String(dashboardFilter));
  }, [isAuthenticated, activeTab, selectedAccountId, dashboardFilter]);

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
    if (!showProfile) prevNavRef.current = null;
  }, [showProfile]);

  const openProfile = () => {
    prevNavRef.current = { tab: activeTab, accountId: selectedAccountId };
    setShowProfile(true);
    setSelectedAccountId(null);
  };

  const closeProfile = () => {
    if (prevNavRef.current) {
      setActiveTab(prevNavRef.current.tab);
      setSelectedAccountId(prevNavRef.current.accountId);
    }
    setShowProfile(false);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const cachedSettings = await localDb.getSettings() as Record<string, unknown> | undefined;
      if (cachedSettings) {
        const darkStyle = (['dark', 'dark-dim', 'dark-night'].includes(cachedSettings.darkModeStyle as string) ? cachedSettings.darkModeStyle : 'dark') as 'dark' | 'dark-dim' | 'dark-night';
        setSettings({
          ...defaultSettings,
          ...(cachedSettings as Partial<typeof defaultSettings>),
          accentColor: (cachedSettings.accentColor as string) || '#A78BFA',
          darkModeStyle: darkStyle,
          typeColors: { ...defaultTypeColors, ...((cachedSettings.typeColors as Record<string, string>) || {}) }
        });
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    authService.apiFetch('/api/recurring/process', { method: 'POST' }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      stopSyncScheduler();
      return;
    }
    syncNow();
    startSyncScheduler();
  }, [isAuthenticated]);

  const checkSignupNudge = useCallback(async () => {
    if (isAuthenticated) return;
    const dismissed = await localDb.getMeta('signup_nudge_dismissed');
    if (dismissed) return;
    const count = await localDb.getTransactionCount();
    if (count >= 5) setShowSignupNudge(true);
  }, [isAuthenticated]);

  const handleDataSaved = useCallback(() => {
    void checkSignupNudge();
    void reloadFromLocal();
    setRefreshCounter(c => c + 1);
  }, [checkSignupNudge, reloadFromLocal]);

  const handleExportData = async () => {
    const blob = new Blob([JSON.stringify({ members, accounts, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleClearCache = async () => {
    if (confirm("Clear cache?")) { await localDb.clearAll(); window.location.reload(); }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'loans', label: 'Loans', icon: Handshake },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'recyclebin', label: 'Recycle Bin', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    if (showProfile) {
      return <UserProfile userEmail={userEmail} onRefreshData={() => fetchData(true)} onExportData={handleExportData} onClearCache={handleClearCache} onLogout={handleLogout} currency={settings.currency} accounts={accounts} />;
    }
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) return <div className="p-8 text-center text-muted">Account not found</div>;
      return <Ledger account={account} onBack={() => setSelectedAccountId(null)} onWriteOperation={setWriteOperation} currency={settings.currency} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard accounts={accounts} members={members} filterMemberId={dashboardFilter} setFilterMemberId={setDashboardFilter} onSelectAccount={setSelectedAccountId} onWriteOperation={setWriteOperation} onGenerateReport={() => setActiveTab('reports')} settings={settings} userName={localStorage.getItem('user_name') || ''} dataLoading={dataLoading} />;
      case 'members': return <MemberManager members={members} accounts={accounts} onUpdate={fetchData} onSelectAccount={setSelectedAccountId} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'accounts': return <AccountManager accounts={accounts} members={members} onUpdate={fetchData} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'groups': return <GroupManager onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
      case 'investments': return <InvestmentTracker accounts={accounts} currency={settings.currency} onWriteOperation={setWriteOperation} />;
      case 'loans': return <LoanManager accounts={accounts} currency={settings.currency} onWriteOperation={setWriteOperation} refreshCounter={refreshCounter} />;
      case 'reports': return <ReportGenerator accounts={accounts} members={members} currency={settings.currency} />;
      case 'recyclebin': return <RecycleBin />;
      case 'settings': return <Settings settings={settings} onUpdateSettings={(s: typeof settings) => { setSettings(s); localDb.setSettings(s as Record<string, unknown>); }} />;
      default: return null;
    }
  };

  if (authStatus === 'loading') return <LoadingScreen fullScreen />;
  if (!isAuthenticated && authPage !== 'login') {
    return (
      <Suspense fallback={<LoadingScreen fullScreen />}>
        {authPage === 'signup' && <Signup onSignup={handleLogin} onBackToLogin={() => setAuthPage('login')} />}
        {authPage === 'forgot' && <ForgotPassword onBackToLogin={() => setAuthPage('login')} />}
        {authPage === 'reset' && <ResetPassword onResetComplete={() => setAuthPage('login')} />}
      </Suspense>
    );
  }
  if (!isAuthenticated && authPage === 'login') {
    return (
      <Suspense fallback={<LoadingScreen fullScreen />}>
        <Login
          onLogin={handleLogin}
          onGoToSignup={() => setAuthPage('signup')}
          onGoToForgotPassword={() => setAuthPage('forgot')}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </Suspense>
    );
  }

  if (dataLoading && members.length === 0 && accounts.length === 0) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <><div className="h-[100dvh] overflow-hidden md:h-auto md:min-h-[100dvh] bg-canvas flex flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        isMobileMenuOpen={false} setIsMobileMenuOpen={() => {}}
        settings={settings} onLogout={handleLogout} navItems={navItems}
        userEmail={userEmail} showProfile={showProfile} onOpenProfile={openProfile} onCloseProfile={closeProfile} setShowProfile={setShowProfile}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 md:pl-64">
        <Header 
          setIsMobileMenuOpen={() => {}} 
          selectedAccountId={selectedAccountId} 
          activeTabLabel={navItems.find(i => i.id === activeTab)?.label}
          accounts={accounts}
          members={members}
          darkMode={settings.darkMode}
          onToggleDarkMode={() => {
            const next = !settings.darkMode;
            const updated = { ...settings, darkMode: next };
            setSettings(updated);
            localDb.setSettings(updated as Record<string, unknown>);
          }}
          onSearchSelect={(type, id, accountId) => {
            if (type === 'account') { setSelectedAccountId(id); }
            else if (type === 'transaction' && accountId) { setSelectedAccountId(accountId); }
            else if (type === 'loan') { setActiveTab('loans'); }
            else { setActiveTab('dashboard'); setDashboardFilter(id); }
          }}
          userEmail={userEmail}
          onOpenProfile={openProfile}
        />

        <div ref={scrollRef} className="flex-1 min-h-0 p-4 md:p-8 md:pb-8 pb-20 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={showProfile ? 'profile' : selectedAccountId || activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
              <Suspense fallback={<LoadingScreen />}>{renderContent()}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ErrorBoundary>
        {writeOperation && (
          <Suspense fallback={null}>
            <WriteModal
              operation={writeOperation}
              accounts={accounts}
              members={members}
              currency={settings.currency}
              onClose={() => setWriteOperation(null)}
               onTransactionSaved={handleDataSaved}
            />
          </Suspense>
        )}
      </ErrorBoundary>
      {showSignupNudge && (
        <Suspense fallback={null}>
          <SignupNudge
            open={showSignupNudge}
            onSignUp={() => { setShowSignupNudge(false); setAuthPage('signup'); }}
            onDismiss={() => setShowSignupNudge(false)}
            onNeverShow={() => setShowSignupNudge(false)}
          />
        </Suspense>
      )}
      <div className="md:hidden">
        <BottomNav
          activeTab={activeTab}
          selectedAccountId={selectedAccountId}
          onTabChange={(tab) => {
            if (showProfile) {
              closeProfile();
            } else {
              setActiveTab(tab as typeof activeTab);
              setSelectedAccountId(null);
            }
          }}
          onNewTransaction={() => setWriteOperation({ type: 'transaction' })}
          onTransfer={() => setWriteOperation({ type: 'transfer' })}
          visible={navVisible}
        />
      </div>
    </div>
      {import.meta.env.VITE_AGENTATION === 'true' && <Agentation />}
    </>
  );
}
