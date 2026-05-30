import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockResult, MOCK_ACCOUNT, MOCK_TRANSACTION, MOCK_LOAN } from "./helpers.js";

let app: typeof import("../index.js").default;

beforeEach(async () => {
  vi.clearAllMocks();
  mockResult([]);
  app = (await import("../index.js")).default;
});

function req() {
  return import("supertest").then(m => m.default(app));
}

describe("Accounts CRUD", () => {
  it("POST creates an account", async () => {
    mockResult({ ...MOCK_ACCOUNT, id: 99 });
    const res = await (await req()).post("/api/accounts").send({
      name: "Savings", type: "bank", color: "#0052ff", initial_balance: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("POST without name returns 400", async () => {
    const res = await (await req()).post("/api/accounts").send({ type: "bank" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH updates an account", async () => {
    mockResult(null);
    const res = await (await req()).patch("/api/accounts/1").send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Transactions CRUD", () => {
  it("POST creates a transaction", async () => {
    mockResult({ ...MOCK_TRANSACTION, id: 99 });
    const res = await (await req()).post("/api/transactions").send({
      account_id: 1, date: "2026-01-15", particulars: "Coffee", amount: -50, category: "Food",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("POST without required fields returns 400", async () => {
    const res = await (await req()).post("/api/transactions").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH updates a transaction", async () => {
    mockResult(MOCK_TRANSACTION);
    const res = await (await req()).patch("/api/transactions/1").send({ particulars: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE deletes a transaction", async () => {
    mockResult(MOCK_TRANSACTION);
    const res = await (await req()).delete("/api/transactions/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Loans CRUD", () => {
  it("POST creates a person loan", async () => {
    mockResult({ ...MOCK_LOAN, id: 99 });
    const res = await (await req()).post("/api/loans").send({
      lender_account_id: 1, borrower_name: "Bob", amount: 5000, date_given: "2026-01-01", particulars: "Loan",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("POST without borrower info returns 400", async () => {
    const res = await (await req()).post("/api/loans").send({
      lender_account_id: 1, amount: 5000, date_given: "2026-01-01",
    });
    expect(res.status).toBe(400);
  });

  it("DELETE deletes a loan", async () => {
    mockResult(null);
    const res = await (await req()).delete("/api/loans/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Members CRUD", () => {
  it("POST creates a member", async () => {
    mockResult({ id: 99, name: "Bob", relationship: "Friend" });
    const res = await (await req()).post("/api/members").send({ name: "Bob", relationship: "Friend" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Bob");
  });

  it("POST without name returns 400", async () => {
    const res = await (await req()).post("/api/members").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("DELETE deletes a member", async () => {
    mockResult(null);
    const res = await (await req()).delete("/api/members/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Groups CRUD", () => {
  it("POST creates a group", async () => {
    mockResult({ id: 100, name: "HK Bank", type: "group", member_id: 1, color: "#0052ff" });
    const res = await (await req()).post("/api/groups").send({ name: "HK Bank", member_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("DELETE deletes a group", async () => {
    mockResult(null);
    const res = await (await req()).delete("/api/groups/100");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
