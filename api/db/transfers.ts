import { supabase } from "../db.js";

export async function createTransfer(userId: string, data: {
  from_account_id: number; to_account_id: number; date: string; amount: number; particulars?: string
}) {
  const { data: fromAcc }: any = await supabase.from("accounts").select("name, members(name)").eq("id", data.from_account_id).eq("user_id", userId).single();
  const { data: toAcc }: any = await supabase.from("accounts").select("name, members(name)").eq("id", data.to_account_id).eq("user_id", userId).single();

  const fromMember = fromAcc?.members?.[0]?.name ? ` (${fromAcc.members[0].name})` : '';
  const toMember = toAcc?.members?.[0]?.name ? ` (${toAcc.members[0].name})` : '';

  const debitParticulars = `Transfer to: ${toAcc?.name}${toMember}${data.particulars ? ` - ${data.particulars}` : ''}`;
  const creditParticulars = `Transfer from: ${fromAcc?.name}${fromMember}${data.particulars ? ` - ${data.particulars}` : ''}`;

  const { data: debit, error: dError } = await supabase.from("transactions").insert([{
    account_id: data.from_account_id, date: data.date, particulars: debitParticulars,
    category: 'Transfer', amount: -data.amount, type: 'transfer', user_id: userId
  }]).select().single();
  if (dError) throw dError;

  const { data: credit, error: cError } = await supabase.from("transactions").insert([{
    account_id: data.to_account_id, date: data.date, particulars: creditParticulars,
    category: 'Transfer', amount: data.amount, type: 'transfer', linked_transaction_id: debit.id,
    user_id: userId
  }]).select().single();
  if (cError) throw cError;

  await supabase.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id).eq("user_id", userId);
  return { debitId: debit.id, creditId: credit.id };
}
