import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockResult, MOCK_MEMBER, MOCK_ACCOUNT, MOCK_TRANSACTION, MOCK_INVESTMENT, MOCK_LOAN, MOCK_GROUP } from "./helpers.js";

let app: typeof import("../index.js").default;

beforeEach(async () => {
  vi.clearAllMocks();
  mockResult([]);
  app = (await import("../index.js")).default;
});

function req() {
  return import("supertest").then(m => m.default(app));
}

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

describe("Auth Endpoints", () => {
  it("GET /api/auth/me returns user (requireAuth mock injects user)", async () => {
    const res = await (await req()).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
  });

  it("POST /api/auth/logout", async () => {
    const res = await (await req()).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/auth/login without token returns 400", async () => {
    const res = await (await req()).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/session without token returns 400", async () => {
    const res = await (await req()).post("/api/auth/session").send({});
    expect(res.status).toBe(400);
  });
});

// ─── GET Endpoints ───────────────────────────────────────────────────────────

describe("GET /api/members", () => {
  it("returns array", async () => {
    mockResult([MOCK_MEMBER]);
    const res = await (await req()).get("/api/members");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Alice");
  });
});

describe("GET /api/accounts", () => {
  it("returns array", async () => {
    mockResult([MOCK_ACCOUNT]);
    const res = await (await req()).get("/api/accounts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/transactions", () => {
  it("/categories returns array", async () => {
    mockResult([{ category: "Food" }]);
    const res = await (await req()).get("/api/transactions/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/:accountId returns array", async () => {
    mockResult([MOCK_TRANSACTION]);
    const res = await (await req()).get("/api/transactions/1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/investments", () => {
  it("returns array", async () => {
    mockResult([MOCK_INVESTMENT]);
    const res = await (await req()).get("/api/investments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/:id/returns returns array", async () => {
    mockResult([]);
    const res = await (await req()).get("/api/investments/1/returns");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/loans", () => {
  it("returns array", async () => {
    mockResult([MOCK_LOAN]);
    const res = await (await req()).get("/api/loans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/groups", () => {
  it("returns array", async () => {
    mockResult([MOCK_GROUP]);
    const res = await (await req()).get("/api/groups");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/export", () => {
  it("returns full export", async () => {
    mockResult([]);
    const res = await (await req()).get("/api/export");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("members");
    expect(res.body).toHaveProperty("accounts");
    expect(res.body).toHaveProperty("transactions");
    expect(res.body).toHaveProperty("investments");
  });
});
