import { supabaseAdmin } from "../db.js";

export interface PaginationOpts {
  limit?: number;
  offset?: number;
}

export function applyPagination<T extends { range: (start: number, end: number) => T }>(query: T, opts?: PaginationOpts): T {
  if (opts?.limit) {
    const start = opts.offset || 0;
    query = query.range(start, start + opts.limit - 1);
  }
  return query;
}

export async function selectMany<T>(
  table: string,
  columns: string,
  userId: string,
  opts?: PaginationOpts & { filters?: Record<string, unknown>; order?: { column: string; ascending?: boolean } }
): Promise<T[]> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  let query = supabaseAdmin.from(table).select(columns).eq("user_id", userId);
  if (opts?.filters) {
    for (const [key, value] of Object.entries(opts.filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }
  if (opts?.order) {
    query = query.order(opts.order.column, { ascending: opts.order.ascending ?? false });
  }
  if (opts?.limit) {
    const start = opts.offset || 0;
    query = query.range(start, start + opts.limit - 1);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

export async function selectOne<T>(
  table: string,
  columns: string,
  userId: string,
  id: number
): Promise<T | null> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(columns)
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

export async function insertOne<T>(table: string, data: Record<string, unknown>): Promise<T> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data: result, error } = await supabaseAdmin.from(table).insert([data]).select().single();
  if (error) throw error;
  return result as T;
}

export async function updateOne(
  table: string,
  userId: string,
  id: number,
  updates: Record<string, unknown>
): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin.from(table).update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteOne(table: string, userId: string, id: number): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin.from(table).delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function softDeleteOne(table: string, userId: string, id: number): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function restoreOne(table: string, userId: string, id: number): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function permanentDeleteOne(table: string, userId: string, id: number): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

const SOFT_DELETE_TABLES = new Set(["transactions", "accounts", "loans"]);

export function isSoftDeleteTable(table: string): boolean {
  return SOFT_DELETE_TABLES.has(table);
}
