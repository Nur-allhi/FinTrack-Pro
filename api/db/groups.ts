import { db } from "../db.js";
import { insertOne, updateOne } from "./queries.js";

interface AccountRow {
  id: number; name: string; type: string; parent_id?: number | null;
  initial_balance?: number; archived?: number; member_id?: number;
  members?: { name: string } | null;
}

interface TxRow {
  account_id: number; amount: number;
}

export async function getGroups(userId: string) {
  const client = db();
  const { data: groups, error } = await client
    .from("accounts")
    .select("*, members(name)")
    .eq("type", "group")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;

  const { data: children, error: cError } = await client
    .from("accounts")
    .select("id, parent_id, name, type, initial_balance, archived, member_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .not("parent_id", "is", null);
  if (cError) throw cError;

  const { data: allTx, error: txErr } = await client.from("transactions").select("account_id, amount").eq("user_id", userId);
  if (txErr) throw txErr;

  const balances: Record<number, number> = {};
  for (const tx of (allTx || []) as TxRow[]) {
    balances[tx.account_id] = (balances[tx.account_id] || 0) + Number(tx.amount);
  }

  return ((groups || []) as AccountRow[]).map((g) => {
    const childAccounts = ((children || []) as AccountRow[]).filter((c) => c.parent_id === g.id && !c.archived);
    return {
      ...g,
      member_name: g.members?.name,
      child_count: childAccounts.length,
      accumulated_balance: childAccounts.reduce((sum, c) => sum + Number(c.initial_balance || 0) + (balances[c.id] || 0), 0),
      children: childAccounts.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        current_balance: Number(c.initial_balance || 0) + (balances[c.id] || 0)
      }))
    };
  });
}

export async function createGroup(userId: string, name: string, memberId?: number, color?: string) {
  return insertOne("accounts", {
    name, type: 'group', member_id: memberId, color, initial_balance: 0,
    user_id: userId
  });
}

export async function updateGroup(userId: string, id: number, updates: { name?: string; color?: string; member_id?: number | null }) {
  const dbUpdate: Record<string, string | number | boolean | null> = {};
  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.color !== undefined) dbUpdate.color = updates.color;
  if (updates.member_id !== undefined) dbUpdate.member_id = updates.member_id;
  await updateOne("accounts", userId, id, dbUpdate);
}

export async function deleteGroup(userId: string, id: number) {
  const client = db();
  const now = new Date().toISOString();
  await client.from("accounts").update({ parent_id: null }).eq("parent_id", id).eq("user_id", userId);
  await client.from("accounts").update({ deleted_at: now }).eq("id", id).eq("user_id", userId);
}
