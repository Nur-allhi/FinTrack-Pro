import { db, supabase } from "../db.js";

export async function exportAllData(userId: string) {
  if (supabase) {
    const [members, accounts, transactions, investments, returns] = await Promise.all([
      supabase.from("members").select("*").eq("user_id", userId),
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase.from("investments").select("*").eq("user_id", userId),
      supabase.from("investment_returns").select("*"),
    ]);
    return {
      members: members.data || [],
      accounts: accounts.data || [],
      transactions: transactions.data || [],
      investments: investments.data || [],
      investmentReturns: returns.data || [],
    };
  }

  return {
    members: db.prepare("SELECT * FROM members").all(),
    accounts: db.prepare("SELECT * FROM accounts").all(),
    transactions: db.prepare("SELECT * FROM transactions").all(),
    investments: db.prepare("SELECT * FROM investments").all(),
    investmentReturns: db.prepare("SELECT * FROM investment_returns").all(),
  };
}

export async function importAllData(userId: string, data: {
  members?: any[]; accounts?: any[]; transactions?: any[];
  investments?: any[]; investmentReturns?: any[]
}) {
  if (supabase) {
    if (data.members?.length) await supabase.from("members").delete().eq("user_id", userId);
    if (data.accounts?.length) await supabase.from("accounts").delete().eq("user_id", userId);
    if (data.transactions?.length) await supabase.from("transactions").delete().eq("user_id", userId);
    if (data.investments?.length) await supabase.from("investments").delete().eq("user_id", userId);
    if (data.investmentReturns?.length) await supabase.from("investment_returns").delete().neq("id", 0);

    if (data.members?.length) {
      const { error } = await supabase.from("members").insert(data.members.map((m: any) => ({ ...m, user_id: userId })));
      if (error) throw error;
    }
    if (data.accounts?.length) {
      const { error } = await supabase.from("accounts").insert(data.accounts.map((a: any) => ({ ...a, user_id: userId })));
      if (error) throw error;
    }
    if (data.transactions?.length) {
      const { error } = await supabase.from("transactions").insert(data.transactions.map((t: any) => ({ ...t, user_id: userId })));
      if (error) throw error;
    }
    if (data.investments?.length) {
      const { error } = await supabase.from("investments").insert(data.investments.map((i: any) => ({ ...i, user_id: userId })));
      if (error) throw error;
    }
    if (data.investmentReturns?.length) {
      const { error } = await supabase.from("investment_returns").insert(data.investmentReturns);
      if (error) throw error;
    }
    return { success: true };
  }

  const doImport = db.transaction(() => {
    db.prepare("DELETE FROM investment_returns").run();
    db.prepare("DELETE FROM investments").run();
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM accounts").run();
    db.prepare("DELETE FROM members").run();

    if (data.members?.length) {
      const stmt = db.prepare("INSERT INTO members (id, name, relationship) VALUES (?, ?, ?)");
      for (const m of data.members) stmt.run(m.id, m.name, m.relationship);
    }

    if (data.accounts?.length) {
      const stmt = db.prepare("INSERT INTO accounts (id, name, type, member_id, parent_id, color, archived, initial_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const a of data.accounts) stmt.run(a.id, a.name, a.type, a.member_id, a.parent_id, a.color, a.archived || 0, a.initial_balance || 0);
    }

    if (data.transactions?.length) {
      const stmt = db.prepare("INSERT INTO transactions (id, account_id, date, particulars, category, amount, type, linked_transaction_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const t of data.transactions) stmt.run(t.id, t.account_id, t.date, t.particulars, t.category, t.amount, t.type || 'normal', t.linked_transaction_id, t.summary);
    }

    if (data.investments?.length) {
      const stmt = db.prepare("INSERT INTO investments (id, account_id, principal, date) VALUES (?, ?, ?, ?)");
      for (const i of data.investments) stmt.run(i.id, i.account_id, i.principal, i.date);
    }

    if (data.investmentReturns?.length) {
      const stmt = db.prepare("INSERT INTO investment_returns (id, investment_id, date, amount, percentage) VALUES (?, ?, ?, ?, ?)");
      for (const r of data.investmentReturns) stmt.run(r.id, r.investment_id, r.date, r.amount, r.percentage);
    }
  });

  doImport();
  return { success: true };
}

export async function clearAllData(userId: string) {
  if (supabase) {
    await Promise.all([
      supabase.from("investment_returns").delete().neq("id", 0),
      supabase.from("investments").delete().eq("user_id", userId),
      supabase.from("transactions").delete().eq("user_id", userId),
      supabase.from("accounts").delete().eq("user_id", userId),
      supabase.from("members").delete().eq("user_id", userId),
    ]);
    return { success: true };
  }

  const doClear = db.transaction(() => {
    db.prepare("DELETE FROM investment_returns").run();
    db.prepare("DELETE FROM investments").run();
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM accounts").run();
    db.prepare("DELETE FROM members").run();
  });
  doClear();
  return { success: true };
}
