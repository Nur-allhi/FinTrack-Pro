import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient | null> | null = null;
let _onSessionExpired: (() => void) | null = null;
let _signedOut = false;
let _guestMode = false;

export function setOnSessionExpired(callback: () => void) {
  _onSessionExpired = callback;
}

export function setGuestMode(enabled: boolean) {
  _guestMode = enabled;
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
      _supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT' && !_signedOut) {
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
    await setSession(data.session.access_token);
    return data.session.access_token;
  }
  return null;
}

async function setSession(accessToken: string): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });
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

  async setSession(accessToken: string) {
    _signedOut = false;
    return setSession(accessToken);
  },

  async clearSession() {
    await fetch('/api/auth/logout', { method: 'POST' });
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

  async signUp(email: string, password: string) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  },

  async signOut() {
    _signedOut = true;
    const sb = await getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    await this.clearSession();
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    getSupabase().then(sb => {
      if (!sb) return;
      sb.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });
    });
  },

  async apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (_guestMode && !url.includes('/api/auth/')) {
      return new Response(JSON.stringify({ error: 'Guest mode' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    if (_signedOut && !url.includes('/api/auth/logout')) {
      return new Response(JSON.stringify({ error: 'Signed out' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      const newToken = await refreshTokenInternal();
      if (newToken) {
        return fetch(url, { ...options, headers });
      }
      if (!_signedOut) {
        _onSessionExpired?.();
      }
    }
    return res;
  }
};
