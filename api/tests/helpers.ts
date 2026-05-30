import { vi } from "vitest";

// Prevent app from listening during tests
process.env.NODE_ENV = "production";

// ─── vi.hoisted: variables that survive vi.mock hoisting ─────────────────────

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

// ─── Chain Builder ───────────────────────────────────────────────────────────

type MockResult = { data: unknown; error: null } | { data: null; error: { message: string; code?: string } };

let _nextResult: MockResult = { data: [], error: null };

export function mockResult(data: unknown, error?: { message: string; code?: string }) {
  _nextResult = error ? { data: null, error } : { data, error: null };
}

export function resetMocks() {
  _nextResult = { data: [], error: null };
  vi.clearAllMocks();
}

function createChain() {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert", "rpc",
    "eq", "neq", "gte", "lte", "gt", "lt",
    "order", "limit", "range", "single", "maybeSingle",
    "ilike", "in", "is", "contains", "overlaps",
    "like", "not", "or", "filter",
  ];
  for (const m of methods) {
    chain[m] = (..._args: unknown[]) => chain;
  }
  // Allow `await` to resolve with mock result
  (chain as any).then = (resolve: (v: MockResult) => void, reject?: (e: unknown) => void) => {
    const result = _nextResult;
    if (result.error && reject) reject(result.error);
    else resolve(result);
  };
  return chain;
}

// ─── Mock Setup (called once per test file) ──────────────────────────────────

vi.mock("../db.js", () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: (..._args: unknown[]) => createChain(),
  },
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: (..._args: unknown[]) => createChain(),
  },
  initDb: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((req: { user?: { id: string; email: string } }, _res: unknown, next: () => void) => {
    req.user = { id: "test-user-id", email: "test@example.com" };
    next();
  }),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

// Default mock: getUser returns valid user
mockGetUser.mockResolvedValue({
  data: { user: { id: "test-user-id", email: "test@example.com" } },
  error: null,
});

// ─── Default Mock Data ───────────────────────────────────────────────────────

export const MOCK_USER = { id: "test-user-id", email: "test@example.com" };
export const MOCK_MEMBER = { id: 1, name: "Alice", relationship: "Friend" };
export const MOCK_ACCOUNT = { id: 1, name: "Cash", type: "cash", member_id: 1, color: "#0052ff", archived: 0, initial_balance: 1000, current_balance: 1500 };
export const MOCK_TRANSACTION = { id: 1, account_id: 1, date: "2026-01-15", particulars: "Groceries", category: "Food", amount: -500, type: "normal" };
export const MOCK_INVESTMENT = { id: 1, account_id: 1, principal: 10000, date: "2026-01-01", account_name: "Investment Fund" };
export const MOCK_LOAN = { id: 1, lender_account_id: 1, borrower_account_id: 2, borrower_name: "Bob", amount: 5000, remaining: 3000, date_given: "2026-01-01", status: "active", particulars: "Loan to Bob" };
export const MOCK_GROUP = { id: 100, name: "HK Bank", type: "group", member_id: 1, color: "#0052ff", child_count: 2, accumulated_balance: 5000, children: [] };
