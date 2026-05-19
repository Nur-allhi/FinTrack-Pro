import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient | null> | null = null;
let _onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: () => void) {
  _onSessionExpired = callback;
}

async function getSupabase(): Promise<SupabaseClient | null> {
  if (_supabase) return _supabase;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const res = await fetch('/api/auth/config');
      const config = await res.json();
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        console.warn('Supabase not configured for frontend auth');
        return null;
      }
      _supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (session?.access_token) {
            localStorage.setItem('auth_token', session.access_token);
          }
        }
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('auth_token');
          _onSessionExpired?.();
        }
      });
      return _supabase;
    } catch (err) {
      console.error('Failed to init Supabase auth:', err);
      return null;
    }
  })();

  return _initPromise;
}

async function refreshTokenInternal(): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session?.access_token) {
    localStorage.setItem('auth_token', data.session.access_token);
    return data.session.access_token;
  }
  return null;
}

export const authService = {
  async getClient() {
    return getSupabase();
  },

  async signInWithGoogle() {
    const sb = await getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  },

  async signInWithPassword(email: string, password: string) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const sb = await getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  },

  async refreshToken(): Promise<string | null> {
    return refreshTokenInternal();
  },

  async signOut() {
    const sb = await getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  },

  onAuthStateChange(callback: (session: any) => void) {
    getSupabase().then(sb => {
      if (!sb) return;
      sb.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });
    });
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  async apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      const newToken = await refreshTokenInternal();
      if (newToken && newToken !== token) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      }
      if (!newToken) {
        localStorage.removeItem('auth_token');
        _onSessionExpired?.();
      }
    }
    return res;
  }
};
