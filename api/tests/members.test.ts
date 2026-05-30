import { describe, it, expect, vi, beforeAll } from "vitest";

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 1, name: "Alice", relationship: "Friend" }, error: null })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 1, name: "Alice", relationship: "Friend" }, error: null }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          }))
        })),
      }))
    }))
  }))
};

vi.mock("../db.js", () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => next()),
}));

import { createMember, getMembers, deleteMember } from "../db/members.js";

describe("Members Data Layer", () => {
  it("getMembers returns array", async () => {
    const members = await getMembers("test-user");
    expect(Array.isArray(members)).toBe(true);
  });

  it("createMember returns object with id", async () => {
    const member = await createMember("test-user", "Alice", "Friend");
    expect(member).toHaveProperty("id");
    expect(member.name).toBe("Alice");
  });

  it("deleteMember succeeds", async () => {
    await expect(deleteMember("test-user", 1)).resolves.toBeUndefined();
  });
});
