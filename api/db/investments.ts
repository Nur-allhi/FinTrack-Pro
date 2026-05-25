import { db, supabase } from "../db.js";

export async function getInvestments(userId: string) {
  if (supabase) {
    const { data, error } = await supabase.from("investments").select("*, accounts(name)").eq("user_id", userId);
    if (error) throw error;
    return (data || []).map((i: any) => ({ ...i, account_name: i.accounts?.name }));
  }
  return db.prepare(`
    SELECT i.*, a.name as account_name 
    FROM investments i
    JOIN accounts a ON i.account_id = a.id
  `).all();
}

export async function createInvestment(userId: string, accountId: number, principal: number, date: string) {
  if (supabase) {
    const { data, error } = await supabase.from("investments").insert([{ account_id: accountId, principal, date, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  }
  const info = db.prepare("INSERT INTO investments (account_id, principal, date) VALUES (?, ?, ?)").run(accountId, principal, date);
  return { id: info.lastInsertRowid, account_id: accountId, principal, date };
}

export async function getInvestmentReturns(investmentId: number) {
  if (supabase) {
    const { data, error } = await supabase.from("investment_returns").select("*").eq("investment_id", investmentId).order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return db.prepare("SELECT * FROM investment_returns WHERE investment_id = ? ORDER BY date DESC").all(investmentId);
}

export async function createInvestmentReturn(investmentId: number, date: string, amount: number, percentage?: number) {
  if (supabase) {
    const { data, error } = await supabase.from("investment_returns").insert([{ investment_id: investmentId, date, amount, percentage }]).select().single();
    if (error) throw error;
    return data;
  }
  const info = db.prepare("INSERT INTO investment_returns (investment_id, date, amount, percentage) VALUES (?, ?, ?, ?)").run(investmentId, date, amount, percentage);
  return { id: info.lastInsertRowid, investment_id: investmentId, date, amount, percentage };
}
