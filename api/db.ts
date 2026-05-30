import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

function getClient(url: string | undefined, key: string | undefined): SupabaseClient {
  if (!url || !key) throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  return createClient(url, key);
}

export const supabase = getClient(supabaseUrl, supabaseKey);

export const initDb = async () => {
  console.log("Using Supabase as the database.");
};
