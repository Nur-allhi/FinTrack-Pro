import { supabaseAdmin } from "../db.js";
import { insertOne, updateOne } from "./queries.js";
import type { Account } from "../../shared/types.js";

interface SupabaseAccountRow {
  id: number; name: string; type: string; member_id?: number; parent_id?: number;
  color?: string; archived?: number; initial_balance?: number; user_id?: string;
  members?: { name: string } | { name: string }[] | null;
  parents?: { name: string } | null;
}

function accountRowToAccount(row: SupabaseAccountRow, txSum: number): Account {
  const memberName = Array.isArray(row.members) ? row.members[0]?.name : (row.members as { name?: string })?.name;
  return {
    ...row,
    member_name: memberName,
    parent_name: (row.parents as { name?: string })?.name,
    current_balance: Number(row.initial_balance || 0) + txSum,
  };
}

export async function getAccounts(userId: string, limit?: number, offset?: number): Promise<Account[]> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  let query = supabaseAdmin.from("accounts").select("*, members(name), parents:parent_id(name)").eq("user_id", userId).is("deleted_at", null);
  if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
  const { data: accounts, error: accError } = await query;
  if (accError) throw accError;

  const { data: transactions, error: txError } = await supabaseAdmin.from("transactions").select("account_id, amount").eq("user_id", userId).is("deleted_at", null);
  if (txError) throw txError;

  const txMap = new Map<number, number>();
  for (const tx of transactions || []) {
    txMap.set(tx.account_id, (txMap.get(tx.account_id) || 0) + Number(tx.amount));
  }

  return (accounts || [])
    .filter((a: SupabaseAccountRow) => a.type !== 'group')
    .map((a: SupabaseAccountRow) => accountRowToAccount(a, txMap.get(a.id) || 0));
}

export async function createAccount(userId: string, data: { name: string; type: string; member_id?: number; parent_id?: number; color?: string; initial_balance?: number }): Promise<Account> {
  return insertOne<Account>("accounts", {
    name: data.name, type: data.type, member_id: data.member_id, parent_id: data.parent_id,
    color: data.color, initial_balance: data.initial_balance || 0, user_id: userId
  });
}

export async function updateAccount(userId: string, id: number, updates: Partial<Account>) {
  await updateOne("accounts", userId, id, updates as Record<string, unknown>);
}

export async function deleteAccount(userId: string, id: number) {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
