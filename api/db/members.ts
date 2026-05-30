import { selectMany, insertOne, deleteOne } from "./queries.js";
import type { Member } from "../../shared/types.js";

export async function getMembers(userId: string): Promise<Member[]> {
  return selectMany<Member>("members", "*", userId);
}

export async function createMember(userId: string, name: string, relationship: string): Promise<Member> {
  return insertOne<Member>("members", { name, relationship, user_id: userId });
}

export async function deleteMember(userId: string, id: number): Promise<void> {
  await deleteOne("members", userId, id);
}
