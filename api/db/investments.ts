import { supabase } from "../db.js";

export async function getInvestments(userId: string) {
  const { data, error } = await supabase.from("investments").select("*, accounts(name)").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((i: any) => ({ ...i, account_name: i.accounts?.name }));
}

export async function createInvestment(userId: string, accountId: number, principal: number, date: string) {
  const { data, error } = await supabase.from("investments").insert([{ account_id: accountId, principal, date, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function getInvestmentReturns(investmentId: number) {
  const { data, error } = await supabase.from("investment_returns").select("*").eq("investment_id", investmentId).order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInvestmentReturn(investmentId: number, date: string, amount: number, percentage?: number) {
  const { data, error } = await supabase.from("investment_returns").insert([{ investment_id: investmentId, date, amount, percentage }]).select().single();
  if (error) throw error;
  return data;
}
