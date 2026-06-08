import { useState, useEffect, useCallback } from 'react';
import { authService, setOnSessionExpired, setGuestMode } from '../services/authService';
import { initPendingCount, syncNow } from '../services/syncEngine';
import { localDb } from '../services/localDb';
import { useToast } from '../components/Toast';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

export interface AuthUser {
  email: string;
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
    localStorage.clear();
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
