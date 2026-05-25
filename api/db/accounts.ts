import { db, supabase } from "../db.js";
import type { Account } from "../../shared/types.js";

interface SupabaseAccountRow {
  id: number; name: string; type: string; member_id?: number; parent_id?: number;
  color?: string; archived?: number; initial_balance?: number; user_id?: string;
  members?: { name: string } | { name: string }[] | null;
  parents?: { name: string } | null;
}

function accountRowToAccount(row: SupabaseAccountRow, txSum: number): Account {
  const memberName = Array.isArray(row.members) ? row.members[0]?.name : (row.members as any)?.name;
  return {
    ...row,
    member_name: memberName,
    parent_name: (row.parents as any)?.name,
    current_balance: Number(row.initial_balance || 0) + txSum,
  };
}

export async function getAccounts(userId: string, limit?: number, offset?: number): Promise<Account[]> {
  if (supabase) {
    let query = supabase.from("accounts").select("*, members(name), parents:parent_id(name)").eq("user_id", userId);
    if (limit) query = query.range(offset || 0, (offset || 0) + limit - 1);
    const { data: accounts, error: accError } = await query;
    if (accError) throw accError;

    const { data: transactions, error: txError } = await supabase.from("transactions").select("account_id, amount").eq("user_id", userId);
    if (txError) throw txError;

    const txMap = new Map<number, number>();
    for (const tx of transactions || []) {
      txMap.set(tx.account_id, (txMap.get(tx.account_id) || 0) + Number(tx.amount));
    }

    return (accounts || [])
      .filter((a: SupabaseAccountRow) => a.type !== 'group')
      .map((a: SupabaseAccountRow) => accountRowToAccount(a, txMap.get(a.id) || 0));
  }

  return db.prepare(`
    SELECT a.*, m.name as member_name, p.name as parent_name,
           (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as current_balance
    FROM accounts a 
    LEFT JOIN members m ON a.member_id = m.id
    LEFT JOIN accounts p ON a.parent_id = p.id
    WHERE a.type != 'group'
  `).all() as Account[];
}

export async function createAccount(userId: string, data: { name: string; type: string; member_id?: number; parent_id?: number; color?: string; initial_balance?: number }): Promise<Account> {
  if (supabase) {
    const { data: result, error } = await supabase.from("accounts").insert([{ 
      name: data.name, type: data.type, member_id: data.member_id, parent_id: data.parent_id,
      color: data.color, initial_balance: data.initial_balance || 0, user_id: userId
    }]).select().single();
    if (error) throw error;
    return result as Account;
  }
  const info = db.prepare("INSERT INTO accounts (name, type, member_id, parent_id, color, initial_balance) VALUES (?, ?, ?, ?, ?, ?)")
    .run(data.name, data.type, data.member_id, data.parent_id, data.color, data.initial_balance || 0);
  return { id: info.lastInsertRowid as number, ...data };
}

export async function updateAccount(userId: string, id: number, updates: Partial<Account>) {
  if (supabase) {
    const { error } = await supabase.from("accounts").update(updates).eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const setClauses: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (setClauses.length > 0) {
    params.push(id);
    db.prepare(`UPDATE accounts SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  }
}
