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
  Handshake,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from './components/LoadingScreen';
import OfflineIndicator from './components/OfflineIndicator';
import UserProfile from './components/UserProfile';
import FloatingActionButton from './components/FloatingActionButton';
import ErrorBoundary from './components/ErrorBoundary';

import { cacheService } from './services/cacheService';
import { authService } from './services/authService';
import { offlineService } from './services/offlineService';
import { useToast } from './components/Toast';
import { Agentation } from 'agentation';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { useAuth } from './hooks/useAuth';
import { useThemeEffects } from './hooks/useThemeEffects';
import { useOfflineSync } from './hooks/useOfflineSync';

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
const RecycleBin = lazy(() => import('./components/RecycleBin'));
const Login = lazy(() => import('./components/Login'));

const defaultTypeColors: Record<string, string> = {
  cash: '#10B981', bank: '#0052FF', mobile: '#8B5CF6',
  investment: '#F59E0B', purpose: '#EC4899', home_exp: '#EF4444',
};

export default function App() {
  const { toast } = useToast();
  const { isAuthenticated, userEmail, handleLogin, handleLogout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'accounts' | 'groups' | 'investments' | 'loans' | 'reports' | 'settings' | 'recyclebin'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all' | 'general'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [settings, setSettings] = useState({
    showNetWorth: true,
    showCurrentAssets: true,
    showLiabilities: true,
    showTodos: true,
    enableNotifications: true,
    darkMode: false,
    darkModeStyle: 'dark' as 'dark' | 'dark-dim' | 'dark-night',
    fontSize: 'normal',
    currency: '৳',
    typeColors: { ...defaultTypeColors },
    accentColor: '#0052FF'
  });

  const { isOnline, lastSync, pendingCount, isSyncing, members, accounts, dataLoading, lastUpdate, fetchData } = useOfflineSync(!!isAuthenticated);
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
    setShowProfile(false);
  }, [activeTab]);

  useEffect(() => {
    const loadSettings = async () => {
      const cachedSettings = await cacheService.getSettings();
      if (cachedSettings) {
        const darkStyle = (['dark', 'dark-dim', 'dark-night'].includes(cachedSettings.darkModeStyle) ? cachedSettings.darkModeStyle : 'dark') as 'dark' | 'dark-dim' | 'dark-night';
        setSettings({ ...cachedSettings, accentColor: cachedSettings.accentColor || '#0052FF', darkModeStyle: darkStyle, typeColors: { ...defaultTypeColors, ...(cachedSettings.typeColors || {}) } });
      }
    };
    loadSettings();
  }, []);

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
    { id: 'recyclebin', label: 'Recycle Bin', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
      case 'dashboard': return <Dashboard accounts={accounts} members={members} filterMemberId={dashboardFilter} setFilterMemberId={setDashboardFilter} onSelectAccount={setSelectedAccountId} onOpenTransfer={() => setIsTransferModalOpen(true)} onOpenTransaction={() => setIsTransactionModalOpen(true)} onGenerateReport={() => setActiveTab('reports')} settings={settings} userName={localStorage.getItem('user_name') || ''} dataLoading={dataLoading} />;
      case 'members': return <MemberManager members={members} accounts={accounts} onUpdate={fetchData} onSelectAccount={setSelectedAccountId} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'accounts': return <AccountManager accounts={accounts} members={members} onUpdate={fetchData} currency={settings.currency} typeColors={settings.typeColors} />;
      case 'groups': return <GroupManager onUpdate={fetchData} lastUpdate={lastUpdate} currency={settings.currency} />;
      case 'investments': return <InvestmentTracker accounts={accounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'loans': return <LoanManager accounts={accounts} onUpdate={fetchData} currency={settings.currency} />;
      case 'reports': return <ReportGenerator accounts={accounts} members={members} currency={settings.currency} />;
      case 'recyclebin': return <RecycleBin />;
      case 'settings': return <Settings settings={settings} onUpdateSettings={(s: typeof settings) => { setSettings(s); cacheService.setSettings(s); }} />;
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
          accounts={accounts}
          members={members}
          darkMode={settings.darkMode}
          onToggleDarkMode={() => {
            const next = !settings.darkMode;
            setSettings({ ...settings, darkMode: next });
            cacheService.setSettings({ ...settings, darkMode: next });
          }}
          onSearchSelect={(type, id, accountId) => {
            if (type === 'account') { setSelectedAccountId(id); }
            else if (type === 'transaction' && accountId) { setSelectedAccountId(accountId); }
            else if (type === 'loan') { setActiveTab('loans'); }
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
            <TransferModal accounts={accounts} onClose={() => setIsTransferModalOpen(false)} onUpdate={fetchData} currency={settings.currency} />
          </Suspense>
        )}
        {isTransactionModalOpen && (
          <Suspense fallback={null}>
            <TransactionModal accounts={accounts} onClose={() => setIsTransactionModalOpen(false)} onUpdate={fetchData} initialAccountId={selectedAccountId || undefined} currency={settings.currency} />
          </Suspense>
        )}
      </ErrorBoundary>
      <div className="md:hidden"><FloatingActionButton onNewTransaction={() => setIsTransactionModalOpen(true)} onNewTransfer={() => setIsTransferModalOpen(true)} isTransactionModalOpen={isTransactionModalOpen} isTransferModalOpen={isTransferModalOpen} /></div>
    </div>
      {import.meta.env.VITE_AGENTATION === 'true' && <Agentation />}
    </>
  );
}
