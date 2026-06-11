import { useState, useEffect, useCallback } from 'react';
import { authService, setOnSessionExpired, setGuestMode } from '../services/authService';
import { initPendingCount, syncNow, stopSyncScheduler } from '../services/syncEngine';
import { localDb } from '../services/localDb';
import { useToast } from '../components/Toast';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

export interface AuthUser {
  email: string;
}

function isServerReachable(): Promise<boolean> {
  return new Promise(resolve => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, 1500);
    fetch('/api/auth/config', { signal: controller.signal, method: 'HEAD' })
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch(() => { clearTimeout(timer); resolve(false); });
  });
}

export function useAuth() {
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const init = async () => {
      if (sessionStorage.getItem('guest_mode') === 'true') {
        initPendingCount();
        setGuestMode(true);
        localDb.getOrCreateGuestId().catch(() => {});
        setAuthStatus('guest');
        return;
      }

      initPendingCount();

      // Try to refresh token from Supabase session first (works offline too)
      try {
        const token = await authService.refreshToken();
        if (token) {
          const meRes = await fetch('/api/auth/me');
          if (meRes.ok) {
            const d = await meRes.json();
            if (d.user?.email) setUserEmail(d.user.email);
            setGuestMode(false);
            setAuthStatus('authenticated');
            return;
          }
          // Token returned but /api/auth/me failed — token may be stale.
          // Wait briefly for Supabase auto-refresh, then retry before falling through.
          await new Promise(r => setTimeout(r, 400));
          const meRes2 = await fetch('/api/auth/me');
          if (meRes2.ok) {
            const d = await meRes2.json();
            if (d.user?.email) setUserEmail(d.user.email);
            setGuestMode(false);
            setAuthStatus('authenticated');
            return;
          }
        }
      } catch {}

      // Token refresh failed — check server reachability before giving up
      const online = await isServerReachable();
      if (!online) {
        // Server unreachable but token might still be valid — keep loading briefly
        // The Login component will attempt its own refresh
        setAuthStatus('guest');
        return;
      }

      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setGuestMode(false);
          const d = await res.json();
          if (d.user?.email) setUserEmail(d.user.email);
          setAuthStatus('authenticated');
        } else {
          setGuestMode(true);
          localDb.getOrCreateGuestId().catch(() => {});
          setAuthStatus('guest');
        }
      } catch {
        setGuestMode(true);
        localDb.getOrCreateGuestId().catch(() => {});
        setAuthStatus('guest');
      }
    };
    init();
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      setAuthStatus('guest');
      toast("Session expired. Please sign in again.", 'error');
    });
  }, []);

  const handleLogin = useCallback(async (token: string) => {
    sessionStorage.removeItem('guest_mode');
    setGuestMode(false);
    await authService.setSession(token);

    // Verify session was properly set before showing authenticated state
    let sessionOk = false;
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const d = await meRes.json();
        if (d.user?.email) setUserEmail(d.user.email);
        sessionOk = true;
      }
    } catch {}

    if (sessionOk) {
      setAuthStatus('authenticated');
      toast("Login successful.", 'success');
    } else {
      setAuthStatus('guest');
      toast("Login failed. Please try again.", 'error');
    }
  }, [toast]);

  const handleContinueAsGuest = useCallback(() => {
    sessionStorage.setItem('guest_mode', 'true');
    setGuestMode(true);
    setAuthStatus('guest');
  }, []);

  const handleLogout = useCallback(async () => {
    // Push any pending local changes to the server before clearing localDb.
    // If the network is offline or the push fails, keep local data so pending
    // changes (especially deletes) are not lost. Otherwise they'd reappear
    // on next sign-in when the server returns the non-deleted record.
    const allStores = [
      'members', 'accounts', 'transactions', 'loans',
      'loan_settlements', 'investments', 'investment_returns',
      'budgets', 'recurring_transactions',
    ] as const;

    let hasPending = false;
    if (navigator.onLine) {
      try {
        await syncNow();
        for (const store of allStores) {
          const records = await localDb.getAllRecords(store);
          if (records.some(r => r.sync_status === 'pending')) {
            hasPending = true;
            break;
          }
        }
        if (hasPending) {
          toast(`Some changes couldn't be synced and will be preserved for next sign-in.`, 'info');
        }
      } catch (err) {
        hasPending = true;
        console.warn("Sync before logout failed:", err);
      }
    } else {
      for (const store of allStores) {
        const records = await localDb.getAllRecords(store);
        if (records.some(r => r.sync_status === 'pending')) {
          hasPending = true;
          break;
        }
      }
      if (hasPending) {
        toast(`You're offline. Pending changes preserved for next sign-in.`, 'info');
      }
    }

    if (!hasPending) {
      try {
        await localDb.clearAll();
        await localDb.setMeta('sync_timestamp', null);
      } catch (err) {
        console.error("Failed to clear local data:", err);
      }
    }

    await authService.signOut();
    // Stop sync scheduler before clearing data
    stopSyncScheduler();
    // Only clear app-specific keys, not all localStorage (preserves third-party data)
    localStorage.removeItem('last_sync');
    localStorage.removeItem('dashboardFilter');
    sessionStorage.clear();

    setAuthStatus('guest');
    setUserEmail('');
  }, [toast]);

  return {
    isAuthenticated: authStatus === 'authenticated',
    authStatus,
    userEmail,
    handleLogin,
    handleContinueAsGuest,
    handleLogout,
  };
}
