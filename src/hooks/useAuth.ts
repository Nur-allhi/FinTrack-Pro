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
        const res = await authService.apiFetch('/api/auth/me');
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
    const res = await authService.apiFetch('/api/auth/me');
    if (res.ok) {
      const d = await res.json();
      if (d.user?.email) setUserEmail(d.user.email);
    }
    setAuthStatus('authenticated');
    toast("Login successful.", 'success');
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    sessionStorage.setItem('guest_mode', 'true');
    setGuestMode(true);
    setAuthStatus('guest');
  }, []);

  const handleLogout = useCallback(async () => {
    await localDb.clearAll();
    await localDb.setMeta('sync_timestamp', null);
    await authService.signOut();

    // Clear all cached Supabase credentials from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Full page reload to reset all React state, module-level variables
    // (_signedOut, _guestMode, _supabase, etc.) and ensure clean init
    window.location.reload();
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
