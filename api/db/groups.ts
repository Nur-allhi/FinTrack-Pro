import { db, supabase } from "../db.js";

export async function getGroups(userId: string) {
  if (supabase) {
    const { data: groups, error } = await supabase
      .from("accounts")
      .select("*, members(name)")
      .eq("type", "group")
      .eq("user_id", userId)
      .order("name");
    if (error) throw error;

    const { data: children, error: cError } = await supabase
      .from("accounts")
      .select("id, parent_id, name, type, initial_balance, archived, member_id")
      .eq("user_id", userId)
      .not("parent_id", "is", null);
    if (cError) throw cError;

    const { data: allTx, error: txErr } = await supabase.from("transactions").select("account_id, amount").eq("user_id", userId);
    if (txErr) throw txErr;

    const balances: Record<number, number> = {};
    for (const tx of (allTx || [])) {
      balances[tx.account_id] = (balances[tx.account_id] || 0) + Number(tx.amount);
    }

    return (groups || []).map((g: any) => {
      const childAccounts = (children || []).filter((c: any) => c.parent_id === g.id && !c.archived);
      return {
        ...g,
        member_name: g.members?.name,
        child_count: childAccounts.length,
        accumulated_balance: childAccounts.reduce((sum: number, c: any) => sum + Number(c.initial_balance || 0) + (balances[c.id] || 0), 0),
        children: childAccounts.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          current_balance: Number(c.initial_balance || 0) + (balances[c.id] || 0)
        }))
      };
    });
  }

  const groups = db.prepare(`
    SELECT g.*, m.name as member_name,
      COUNT(c.id) as child_count,
      COALESCE(SUM(c.child_balance), 0) as accumulated_balance
    FROM accounts g
    LEFT JOIN (
      SELECT a.id, a.parent_id, a.archived,
        (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as child_balance
      FROM accounts a
    ) c ON c.parent_id = g.id AND c.archived = 0
    LEFT JOIN members m ON g.member_id = m.id
    WHERE g.type = 'group'
    GROUP BY g.id
    ORDER BY g.name
  `).all();

  return (groups as any[]).map(g => {
    const children = db.prepare(`
      SELECT a.*, m.name as member_name,
        (a.initial_balance + COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0)) as current_balance
      FROM accounts a
      LEFT JOIN members m ON a.member_id = m.id
      WHERE a.parent_id = ?
      ORDER BY a.name
    `).all(g.id);
    return { ...g, children };
  });
}

export async function createGroup(userId: string, name: string, memberId?: number, color?: string) {
  if (supabase) {
    const { data, error } = await supabase.from("accounts").insert([{
      name, type: 'group', member_id: memberId, color, initial_balance: 0,
      user_id: userId
    }]).select().single();
    if (error) throw error;
    return data;
  }
  const info = db.prepare("INSERT INTO accounts (name, type, member_id, color, initial_balance) VALUES (?, 'group', ?, ?, 0)")
    .run(name, memberId, color);
  return { id: info.lastInsertRowid, name, type: 'group', member_id: memberId, color };
}

export async function updateGroup(userId: string, id: number, updates: { name?: string; color?: string; member_id?: number | null }) {
  if (supabase) {
    const dbUpdate: any = {};
    if (updates.name !== undefined) dbUpdate.name = updates.name;
    if (updates.color !== undefined) dbUpdate.color = updates.color;
    if (updates.member_id !== undefined) dbUpdate.member_id = updates.member_id;
    const { error } = await supabase.from("accounts").update(dbUpdate).eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  db.prepare(`
    UPDATE accounts SET name = COALESCE(?, name), color = COALESCE(?, color), member_id = COALESCE(?, member_id)
    WHERE id = ? AND type = 'group'
  `).run(updates.name, updates.color, updates.member_id, id);
}

export async function deleteGroup(userId: string, id: number) {
  if (supabase) {
    await supabase.from("accounts").update({ parent_id: null }).eq("parent_id", id).eq("user_id", userId);
    const { error } = await supabase.from("accounts").delete().eq("id", id).eq("type", "group").eq("user_id", userId);
    if (error) throw error;
    return;
  }
  db.transaction(() => {
    db.prepare("UPDATE accounts SET parent_id = NULL WHERE parent_id = ?").run(id);
    db.prepare("DELETE FROM accounts WHERE id = ? AND type = 'group'").run(id);
  })();
}
