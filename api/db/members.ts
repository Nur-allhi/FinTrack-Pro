import { db, supabase } from "../db.js";
import type { Member } from "../../shared/types.js";

export async function getMembers(userId: string): Promise<Member[]> {
  if (supabase) {
    const { data, error } = await supabase.from("members").select("*").eq("user_id", userId);
    if (error) throw error;
    return (data || []) as Member[];
  }
  return db.prepare("SELECT * FROM members").all() as Member[];
}

export async function createMember(userId: string, name: string, relationship: string): Promise<Member> {
  if (supabase) {
    const { data, error } = await supabase.from("members").insert([{ name, relationship, user_id: userId }]).select().single();
    if (error) throw error;
    return data as Member;
  }
  const info = db.prepare("INSERT INTO members (name, relationship) VALUES (?, ?)").run(name, relationship);
  return { id: info.lastInsertRowid as number, name, relationship };
}

export async function deleteMember(userId: string, id: number): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("members").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  db.prepare("DELETE FROM members WHERE id = ?").run(id);
}
