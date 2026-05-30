import { supabaseAdmin } from "../db.js";
import { selectMany, insertOne } from "./queries.js";

export async function getInvestments(userId: string) {
  const data = await selectMany<any>("investments", "*, accounts(name)", userId);
  return data.map((i: any) => ({ ...i, account_name: i.accounts?.name }));
}

export async function createInvestment(userId: string, accountId: number, principal: number, date: string) {
  return insertOne("investments", { account_id: accountId, principal, date, user_id: userId });
}

export async function getInvestmentReturns(investmentId: number) {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin.from("investment_returns").select("*").eq("investment_id", investmentId).order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInvestmentReturn(investmentId: number, date: string, amount: number, percentage?: number) {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin.from("investment_returns").insert([{ investment_id: investmentId, date, amount, percentage }]).select().single();
  if (error) throw error;
  return data;
}
