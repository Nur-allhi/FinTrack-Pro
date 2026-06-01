import { db } from "../db.js";
import type { Member, Account, Transaction, Investment, InvestmentReturn } from "../../shared/types.js";

export async function exportAllData(userId: string) {
  const [members, accounts, transactions, investments, returns] = await Promise.all([
    db().from("members").select("*").eq("user_id", userId),
    db().from("accounts").select("*").eq("user_id", userId).is("deleted_at", null),
    db().from("transactions").select("*").eq("user_id", userId).is("deleted_at", null),
    db().from("investments").select("*").eq("user_id", userId),
    db().from("investment_returns").select("*").in("investment_id",
      (await db().from("investments").select("id").eq("user_id", userId)).data?.map((i: { id: number }) => i.id) || []
    ),
  ]);
  return {
    members: (members.data || []) as Member[],
    accounts: (accounts.data || []) as Account[],
    transactions: (transactions.data || []) as Transaction[],
    investments: (investments.data || []) as Investment[],
    investmentReturns: (returns.data || []) as InvestmentReturn[],
  };
}

export async function importAllData(userId: string, data: {
  members?: Member[]; accounts?: Account[]; transactions?: Transaction[];
  investments?: Investment[]; investmentReturns?: InvestmentReturn[]
}) {
  const { error } = await db().rpc("fintrack_import_data", {
    p_user_id: userId,
    p_members: JSON.stringify(data.members || []),
    p_accounts: JSON.stringify(data.accounts || []),
    p_transactions: JSON.stringify(data.transactions || []),
    p_investments: JSON.stringify(data.investments || []),
    p_investment_returns: JSON.stringify(data.investmentReturns || []),
  });
  if (error) throw error;
  return { success: true };
}

export async function clearAllData(userId: string) {
  const userInvestments = await db().from("investments").select("id").eq("user_id", userId);
  const investmentIds = userInvestments.data?.map((i: { id: number }) => i.id) || [];
  await Promise.all([
    investmentIds.length > 0 ? db().from("investment_returns").delete().in("investment_id", investmentIds) : Promise.resolve(),
    db().from("investments").delete().eq("user_id", userId),
    db().from("transactions").delete().eq("user_id", userId),
    db().from("accounts").delete().eq("user_id", userId),
    db().from("members").delete().eq("user_id", userId),
  ]);
  return { success: true };
}
