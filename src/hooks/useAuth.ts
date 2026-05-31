import { useState, useEffect } from 'react';
import { authService, setOnSessionExpired } from '../services/authService';
import { offlineService, initPendingCount } from '../services/offlineService';
import { useToast } from '../components/Toast';

export function useAuth() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const init = async () => {
      initPendingCount();
      try {
        const res = await authService.apiFetch('/api/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      setIsAuthenticated(false);
      toast("Session expired. Please sign in again.", 'error');
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    authService.apiFetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.email) setUserEmail(d.user.email);
    }).catch((err) => {
      console.warn('Auth check failed:', err);
    });
  }, [isAuthenticated]);

  const handleLogin = async (token: string) => {
    await authService.setSession(token);
    setIsAuthenticated(true);
    toast("Login successful.", 'success');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setUserEmail('');
    await authService.signOut();
    // Clear Supabase local storage sessions
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  };

  return { isAuthenticated, userEmail, handleLogin, handleLogout };
}
