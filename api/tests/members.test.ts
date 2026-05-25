import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("../db.js", () => ({
  db: {
    prepare: vi.fn(() => ({
      all: vi.fn(() => []),
      run: vi.fn(() => ({ lastInsertRowid: 1 })),
    })),
  },
  supabase: null,
  supabaseAdmin: null,
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
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
