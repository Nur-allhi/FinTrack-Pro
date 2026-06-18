import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "async_hooks";
import type { Request, Response as ExpressResponse, NextFunction } from "express";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUERY_TIMEOUT = 5000;

/** Reachability cache — tracks whether Supabase was recently reachable */
let _lastDbFailure: number | null = null;
const DB_FAILURE_COOLDOWN = 30_000;

export function markDbSuccess(): void {
  _lastDbFailure = null;
}

export function markDbFailure(): void {
  if (_lastDbFailure === null) _lastDbFailure = Date.now();
}

export function isDbLikelyReachable(): boolean {
  if (_lastDbFailure === null) return true;
  return Date.now() - _lastDbFailure > DB_FAILURE_COOLDOWN;
}

/**
 * Express middleware — returns 503 immediately if DB was recently unreachable.
 * Prevents route handlers from waiting the full 5s timeout on every request.
 */
export function requireDbReachable(req: Request, res: ExpressResponse, next: NextFunction): void {
  if (!isDbLikelyReachable()) {
    res.status(503).json({ error: "Database unreachable" });
    return;
  }
  next();
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    markDbSuccess();
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      markDbFailure();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function getClient(url: string | undefined, key: string | undefined): SupabaseClient {
  if (!url || !key) throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  return createClient(url, key, { global: { fetch: fetchWithTimeout } });
}

export const supabase = getClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey, { global: { fetch: fetchWithTimeout } }) : null;

/** Per-request Supabase client store — set by auth middleware */
const requestStore = new AsyncLocalStorage<SupabaseClient>();

export function runWithClient<T>(client: SupabaseClient, fn: () => Promise<T>): Promise<T> {
  return requestStore.run(client, fn);
}

/** Get the request-scoped Supabase client (falls back to supabaseAdmin for non-HTTP contexts) */
export function db(): SupabaseClient {
  const client = requestStore.getStore();
  if (client) return client;
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

/** Create a Supabase client scoped to a user's JWT (enforces RLS when policies exist) */
export function createClientForToken(token: string): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase not configured");
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: fetchWithTimeout },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Wraps a promise with a timeout — rejects if the promise doesn't settle within ms */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms`)), ms)
  );
  promise.then(undefined, () => {}); // swallow orphan rejection (loser of Promise.race)
  timeoutPromise.catch(() => {});     // swallow orphan timeout rejection
  return Promise.race([promise, timeoutPromise]);
}

export const initDb = async () => {
  console.log("Using Supabase as the database.");
};
