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
      if (sessionStorage.getItem('pending_logout') === 'true') {
        sessionStorage.clear();
        setAuthStatus('guest');
        return;
      }

      if (sessionStorage.getItem('guest_mode') === 'true') {
        initPendingCount();
        setGuestMode(true);
        localDb.getOrCreateGuestId().catch(() => {});
        setAuthStatus('guest');
        return;
      }

      initPendingCount();
      try {
        const res = await authService.apiFetch('/api/auth/me');
        if (res.ok) {
          setGuestMode(false);
          setAuthStatus('authenticated');
          const d = await res.json();
          if (d.user?.email) setUserEmail(d.user.email);
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
    setAuthStatus('authenticated');
    const res = await authService.apiFetch('/api/auth/me');
    if (res.ok) {
      const d = await res.json();
      if (d.user?.email) setUserEmail(d.user.email);
    }
    toast("Login successful.", 'success');
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    sessionStorage.setItem('guest_mode', 'true');
    setGuestMode(true);
    setAuthStatus('guest');
  }, []);

  const handleLogout = useCallback(async () => {
    sessionStorage.setItem('pending_logout', 'true');
    await authService.signOut();
    setGuestMode(true);
    setAuthStatus('guest');
    setUserEmail('');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
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
