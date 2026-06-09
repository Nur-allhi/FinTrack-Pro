import { selectMany, insertOne, softDeleteOne } from "./queries.js";
import type { Member } from "../../shared/types.js";

export async function getMembers(userId: string): Promise<Member[]> {
  const members = await selectMany<Member>("members", "*", userId);
  return members.filter(m => !m.deleted_at);
}

export async function createMember(userId: string, name: string, relationship: string): Promise<Member> {
  return insertOne<Member>("members", { name, relationship, user_id: userId });
}

export async function deleteMember(userId: string, id: number): Promise<void> {
  await softDeleteOne("members", userId, id);
}
