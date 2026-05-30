import { supabase } from "../db.js";

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
  opts?: PaginationOpts & { filters?: Record<string, any>; order?: { column: string; ascending?: boolean } }
): Promise<T[]> {
  let query = supabase.from(table).select(columns).eq("user_id", userId);
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
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) {
    if ((error as any).code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

export async function insertOne<T>(table: string, data: Record<string, any>): Promise<T> {
  const { data: result, error } = await supabase.from(table).insert([data]).select().single();
  if (error) throw error;
  return result as T;
}

export async function updateOne(
  table: string,
  userId: string,
  id: number,
  updates: Record<string, any>
): Promise<void> {
  const { error } = await supabase.from(table).update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteOne(table: string, userId: string, id: number): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
