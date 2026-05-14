import express from "express";
import { db, supabase } from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { from_account_id, to_account_id, date, particulars } = req.body;
    const amount = Number(req.body.amount);
    if (!from_account_id || !to_account_id || isNaN(amount)) {
      return res.status(400).json({ error: "Missing required fields or invalid amount" });
    }
    
    if (supabase) {
      const { data: fromAcc }: any = await supabase.from("accounts").select("name, members(name)").eq("id", from_account_id).single();
      const { data: toAcc }: any = await supabase.from("accounts").select("name, members(name)").eq("id", to_account_id).single();

      const fromMember = fromAcc?.members?.[0]?.name ? ` (${fromAcc.members[0].name})` : '';
      const toMember = toAcc?.members?.[0]?.name ? ` (${toAcc.members[0].name})` : '';

      const debitParticulars = `Transfer to: ${toAcc?.name}${toMember}${particulars ? ` - ${particulars}` : ''}`;
      const creditParticulars = `Transfer from: ${fromAcc?.name}${fromMember}${particulars ? ` - ${particulars}` : ''}`;

      const { data: debit, error: dError } = await supabase.from("transactions").insert([{
        account_id: from_account_id, date, particulars: debitParticulars, category: 'Transfer', amount: -amount, type: 'transfer'
      }]).select().single();
      if (dError) throw dError;

      const { data: credit, error: cError } = await supabase.from("transactions").insert([{
        account_id: to_account_id, date, particulars: creditParticulars, category: 'Transfer', amount: amount, type: 'transfer', linked_transaction_id: debit.id
      }]).select().single();
      if (cError) throw cError;

      await supabase.from("transactions").update({ linked_transaction_id: credit.id }).eq("id", debit.id);
      
      return res.json({ debitId: debit.id, creditId: credit.id });
    }

    const fromAcc: any = db.prepare("SELECT a.*, m.name as member_name FROM accounts a LEFT JOIN members m ON a.member_id = m.id WHERE a.id = ?").get(from_account_id);
    const toAcc: any = db.prepare("SELECT a.*, m.name as member_name FROM accounts a LEFT JOIN members m ON a.member_id = m.id WHERE a.id = ?").get(to_account_id);

    const fromMember = fromAcc?.member_name ? ` (${fromAcc.member_name})` : '';
    const toMember = toAcc?.member_name ? ` (${toAcc.member_name})` : '';

    const debitParticulars = `Transfer to: ${toAcc?.name}${toMember}${particulars ? ` - ${particulars}` : ''}`;
    const creditParticulars = `Transfer from: ${fromAcc?.name}${fromMember}${particulars ? ` - ${particulars}` : ''}`;

    const transfer = db.transaction(() => {
        const debitInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type) VALUES (?, ?, ?, ?, ?, ?)").run(from_account_id, date, debitParticulars, 'Transfer', -amount, 'transfer');
        const debitId = debitInfo.lastInsertRowid;

        const creditInfo = db.prepare("INSERT INTO transactions (account_id, date, particulars, category, amount, type, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(to_account_id, date, creditParticulars, 'Transfer', amount, 'transfer', debitId);
        const creditId = creditInfo.lastInsertRowid;

        db.prepare("UPDATE transactions SET linked_transaction_id = ? WHERE id = ?").run(creditId, debitId);
        
        return { debitId, creditId };
    });

    res.json(transfer());
  } catch (err: any) {
    console.error("POST /api/transfers error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
