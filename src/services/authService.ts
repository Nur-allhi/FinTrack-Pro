import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient | null> | null = null;
let _onSessionExpired: (() => void) | null = null;
let _signedOut = false;
let _guestMode = false;
let _csrfToken: string | null = null;

function getCsrfToken(): string | null {
  if (_csrfToken) return _csrfToken;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  _csrfToken = match ? match[1] : null;
  return _csrfToken;
}

export function setOnSessionExpired(callback: () => void) {
  _onSessionExpired = callback;
}

export function setGuestMode(enabled: boolean) {
  _guestMode = enabled;
}

export function getGuestMode(): boolean {
  return _guestMode;
}

async function getSupabase(): Promise<SupabaseClient | null> {
  if (_supabase) return _supabase;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase not configured for frontend auth');
        return null;
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: true }
      });
      _supabase.auth.onAuthStateChange((_event) => {
        // Session expiry is handled by apiFetch's 401 handler.
        // Ignoring Supabase's SIGNED_OUT here because it fires on every init
        // when the stored token is expired, racing with the cached-session fast path.
      });
      return _supabase;
    } catch (err) {
      console.error('Failed to init Supabase auth:', err);
      _initPromise = null;
      return null;
    }
  })();

  return _initPromise;
}

function timeout<T>(ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(fallback), ms));
}

async function refreshTokenInternal(): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  let { data } = await sb.auth.getSession();
  if (data.session?.access_token) {
    try {
      const result = await Promise.race([
        sb.auth.refreshSession(),
        timeout<{ data: { session: null } } | null>(3000, null),
      ]);
      const refreshed = result?.data?.session?.access_token;
      if (refreshed) {
        await setSession(refreshed);
        return refreshed;
      }
    } catch {}
    // Refresh failed — cached token might be expired. Return null so
    // apiFetch can trigger _onSessionExpired instead of retrying with a stale token.
  }
  return null;
}

async function setSession(accessToken: string): Promise<void> {
  try {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
      credentials: 'same-origin',
    });
  } catch { /* offline — swallow */ }
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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
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

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    let unsubscribe: (() => void) | null = null;
    getSupabase().then(sb => {
      if (!sb) return;
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => { unsubscribe?.(); };
  },

  async apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (_guestMode && !url.includes('/api/auth/')) {
      return new Response(JSON.stringify({ error: 'Guest mode — sign in to sync' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (_signedOut && !url.includes('/api/auth/logout')) {
      return new Response(JSON.stringify({ error: 'Signed out' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      const token = getCsrfToken();
      if (token) headers['x-csrf-token'] = token;
    }
    const res = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    if (method === 'GET' || method === 'HEAD') {
      _csrfToken = null;
      getCsrfToken();
    }
    if (res.status === 401) {
      const newToken = await refreshTokenInternal();
      if (newToken) {
        await new Promise(r => setTimeout(r, 100));
        _csrfToken = null;
        getCsrfToken();
        const retryHeaders = { ...headers };
        const retryMethod = (options.method || 'GET').toUpperCase();
        if (retryMethod !== 'GET' && retryMethod !== 'HEAD') {
          const token = getCsrfToken();
          if (token) retryHeaders['x-csrf-token'] = token;
        }
        return fetch(url, { ...options, headers: retryHeaders, credentials: 'same-origin' });
      }
      if (!_signedOut) {
        _onSessionExpired?.();
      }
    }
    return res;
  }
};
