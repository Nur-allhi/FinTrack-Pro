import { useState, useEffect, useCallback } from 'react';
import { authService, setOnSessionExpired, setGuestMode } from '../services/authService';
import { offlineService, initPendingCount } from '../services/offlineService';
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
    try {
      await localDb.clearAll();
      await localDb.setMeta('sync_timestamp', null);
    } catch (err) {
      console.error("Failed to clear local data:", err);
    }

    await authService.signOut();
    localStorage.clear();
    sessionStorage.clear();

    setAuthStatus('guest');
    setUserEmail('');
  }, []);

  return {
    isAuthenticated: authStatus === 'authenticated',
    authStatus,
    userEmail,
    handleLogin,
    handleContinueAsGuest,
    handleLogout,
  };
}
