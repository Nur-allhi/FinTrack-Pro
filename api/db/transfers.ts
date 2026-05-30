import { supabaseAdmin } from "../db.js";

interface AccountWithMembers {
  name: string;
  members?: { name: string }[] | null;
}

function db(): NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  return supabaseAdmin;
}

export async function createTransfer(userId: string, data: {
  from_account_id: number; to_account_id: number; date: string; amount: number; particulars?: string
}) {
  const fromRes = await db().from("accounts").select("name, members(name)").eq("id", data.from_account_id).eq("user_id", userId).single();
  const fromAcc = fromRes.data as AccountWithMembers | null;
  const toRes = await db().from("accounts").select("name, members(name)").eq("id", data.to_account_id).eq("user_id", userId).single();
  const toAcc = toRes.data as AccountWithMembers | null;

  const fromMember = fromAcc?.members?.[0]?.name ? ` (${fromAcc.members[0].name})` : '';
  const toMember = toAcc?.members?.[0]?.name ? ` (${toAcc.members[0].name})` : '';

  const debitParticulars = `Transfer to: ${toAcc?.name}${toMember}${data.particulars ? ` - ${data.particulars}` : ''}`;
  const creditParticulars = `Transfer from: ${fromAcc?.name}${fromMember}${data.particulars ? ` - ${data.particulars}` : ''}`;

  const { data: debit, error: dError } = await db().from("transactions").insert([{
    account_id: data.from_account_id, date: data.date, particulars: debitParticulars,
    category: 'Transfer', amount: -data.amount, type: 'transfer', user_id: userId
  }]).select().single();
  if (dError) throw dError;

  const { data: credit, error: cError } = await db().from("transactions").insert([{
    account_id: data.to_account_id, date: data.date, particulars: creditParticulars,
    category: 'Transfer', amount: data.amount, type: 'transfer', linked_transaction_id: debit.id,
    user_id: userId
  }]).select().single();
  if (cError) throw cError;

  await db().from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);
  return { debitId: debit.id, creditId: credit.id };
}
