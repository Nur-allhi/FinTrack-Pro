import { db, supabase } from "../db.js";

export async function createTransfer(userId: string, data: {
  from_account_id: number; to_account_id: number; date: string; amount: number; particulars?: string
}) {
  if (supabase) {
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

  const fromAcc: any = db.prepare("SELECT a.*, m.name as member_name FROM accounts a LEFT JOIN members m ON a.member_id = m.id WHERE a.id = ?").get(data.from_account_id);
  const toAcc: any = db.prepare("SELECT a.*, m.name as member_name FROM accounts a LEFT JOIN members m ON a.member_id = m.id WHERE a.id = ?").get(data.to_account_id);

  const fromMember = fromAcc?.member_name ? ` (${fromAcc.member_name})` : '';
  const toMember = toAcc?.member_name ? ` (${toAcc.member_name})` : '';

  const debitParticulars = `Transfer to: ${toAcc?.name}${toMember}${data.particulars ? ` - ${data.particulars}` : ''}`;
  const creditParticulars = `Transfer from: ${fromAcc?.name}${fromMember}${data.particulars ? ` - ${data.particulars}` : ''}`;

  const transfer = db.transaction(() => {
    const debitInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)")
      .run(data.from_account_id, data.date, debitParticulars, 'Transfer', -data.amount, 'transfer');
    const debitId = debitInfo.lastInsertRowid;

    const creditInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(data.to_account_id, data.date, creditParticulars, 'Transfer', data.amount, 'transfer', debitId);
    const creditId = creditInfo.lastInsertRowid;

    db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
    return { debitId, creditId };
  });

  return transfer();
}
