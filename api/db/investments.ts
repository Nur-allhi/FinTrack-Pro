import { db } from "../db.js";
import { selectMany, insertOne } from "./queries.js";
import type { Investment, InvestmentReturn } from "../../shared/types.js";

interface InvestmentRow {
  id: number; account_id: number; principal: number; date: string;
  accounts?: { name: string } | null;
}

export async function getInvestmentById(id: number, userId: string) {
  const { data, error } = await db()
    .from("investments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as Investment | null;
}

export async function getInvestments(userId: string) {
  const data = await selectMany<InvestmentRow>("investments", "*, accounts(name)", userId);
  return data.map((i) => ({ ...i, account_name: i.accounts?.name }));
}

export async function createInvestment(userId: string, accountId: number, principal: number, date: string) {
  return insertOne<Investment>("investments", { account_id: accountId, principal, date, user_id: userId });
}

export async function getInvestmentReturns(investmentId: number, userId: string) {
  const { data, error } = await db()
    .from("investment_returns")
    .select("*")
    .eq("investment_id", investmentId)
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []) as InvestmentReturn[];
}

export async function createInvestmentReturn(investmentId: number, userId: string, date: string, amount: number, percentage?: number) {
  const { data, error } = await db()
    .from("investment_returns")
    .insert([{ investment_id: investmentId, user_id: userId, date, amount, percentage }])
    .select()
    .single();
  if (error) throw error;
  return data as InvestmentReturn;
}
