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
      if (sessionStorage.getItem('pending_logout') === 'true') {
        sessionStorage.clear();
        setIsAuthenticated(false);
        return;
      }
      initPendingCount();
      try {
        const res = await authService.apiFetch('/api/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
          const d = await res.json();
          if (d.user?.email) setUserEmail(d.user.email);
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

  const handleLogin = async (token: string) => {
    await authService.setSession(token);
    setIsAuthenticated(true);
    toast("Login successful.", 'success');
  };

  const handleLogout = async () => {
    sessionStorage.setItem('pending_logout', 'true');
    await authService.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  };

  return { isAuthenticated, userEmail, handleLogin, handleLogout };
}
