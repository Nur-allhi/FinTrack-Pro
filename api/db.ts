import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "async_hooks";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient(url: string | undefined, key: string | undefined): SupabaseClient {
  if (!url || !key) throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  return createClient(url, key);
}

export const supabase = getClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

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
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const initDb = async () => {
  console.log("Using Supabase as the database.");
};
