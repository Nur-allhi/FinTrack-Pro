import { supabaseAdmin } from "../db.js";

function db(): NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

export async function exportAllData(userId: string) {
  const [members, accounts, transactions, investments, returns] = await Promise.all([
    db().from("members").select("*").eq("user_id", userId),
    db().from("accounts").select("*").eq("user_id", userId),
    db().from("transactions").select("*").eq("user_id", userId),
    db().from("investments").select("*").eq("user_id", userId),
    db().from("investment_returns").select("*"),
  ]);
  return {
    members: members.data || [],
    accounts: accounts.data || [],
    transactions: transactions.data || [],
    investments: investments.data || [],
    investmentReturns: returns.data || [],
  };
}

export async function importAllData(userId: string, data: {
  members?: any[]; accounts?: any[]; transactions?: any[];
  investments?: any[]; investmentReturns?: any[]
}) {
  if (data.members?.length) await db().from("members").delete().eq("user_id", userId);
  if (data.accounts?.length) await db().from("accounts").delete().eq("user_id", userId);
  if (data.transactions?.length) await db().from("transactions").delete().eq("user_id", userId);
  if (data.investments?.length) await db().from("investments").delete().eq("user_id", userId);
  if (data.investmentReturns?.length) await db().from("investment_returns").delete().neq("id", 0);

  if (data.members?.length) {
    const { error } = await db().from("members").insert(data.members.map((m: any) => ({ ...m, user_id: userId })));
    if (error) throw error;
  }
  if (data.accounts?.length) {
    const { error } = await db().from("accounts").insert(data.accounts.map((a: any) => ({ ...a, user_id: userId })));
    if (error) throw error;
  }
  if (data.transactions?.length) {
    const { error } = await db().from("transactions").insert(data.transactions.map((t: any) => ({ ...t, user_id: userId })));
    if (error) throw error;
  }
  if (data.investments?.length) {
    const { error } = await db().from("investments").insert(data.investments.map((i: any) => ({ ...i, user_id: userId })));
    if (error) throw error;
  }
  if (data.investmentReturns?.length) {
    const { error } = await db().from("investment_returns").insert(data.investmentReturns);
    if (error) throw error;
  }
  return { success: true };
}

export async function clearAllData(userId: string) {
  await Promise.all([
    db().from("investment_returns").delete().neq("id", 0),
    db().from("investments").delete().eq("user_id", userId),
    db().from("transactions").delete().eq("user_id", userId),
    db().from("accounts").delete().eq("user_id", userId),
    db().from("members").delete().eq("user_id", userId),
  ]);
  return { success: true };
}
