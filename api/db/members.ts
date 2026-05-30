import { supabase } from "../db.js";
import type { Member } from "../../shared/types.js";

export async function getMembers(userId: string): Promise<Member[]> {
  const { data, error } = await supabase.from("members").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data || []) as Member[];
}

export async function createMember(userId: string, name: string, relationship: string): Promise<Member> {
  const { data, error } = await supabase.from("members").insert([{ name, relationship, user_id: userId }]).select().single();
  if (error) throw error;
  return data as Member;
}

export async function deleteMember(userId: string, id: number): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
