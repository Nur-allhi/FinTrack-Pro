/**
 * shared/schema.ts — Canonical Schema Definition
 *
 * Single source of truth for all three layers (Supabase, IndexedDB, App types).
 * Every entity field is tagged with where it exists and how it flows.
 *
 * Field categories:
 *   - server: Column exists in PostgreSQL
 *   - local:  Stored in IndexedDB only (never sent to server)
 *   - both:   Present in both, possibly under different names
 */

// ──────────────────────────────────────────
// Sync field mapping helpers
// ──────────────────────────────────────────

export const LOCAL_ONLY_FIELDS = [
  'id',           // local UUID PK → mapped to client_id for server
  'server_id',    // server BIGSERIAL id, stored locally
  'sync_status',  // 'pending' | 'synced' | 'conflict'
  '_deleted',     // boolean soft-delete flag
] as const;

export const SERVER_ID_FIELD = 'server_id';

/** Fields that MUST be stripped from push payloads */
export function isLocalOnly(field: string): boolean {
  return (LOCAL_ONLY_FIELDS as readonly string[]).includes(field);
}

// ──────────────────────────────────────────
// Per-entity canonical schemas
// ──────────────────────────────────────────

export interface ColumnDef {
  /** Exists in PostgreSQL */
  server: boolean;
  /** Exists in IndexedDB */
  local: boolean;
  /** Server column type */
  serverType?: string;
  /** TypeScript type for local storage */
  localType?: string;
  /** How this field flows during sync */
  direction: 'push' | 'pull' | 'both' | 'none' | 'map';
  /** Transform function name when direction is 'map' */
  transform?: string;
  /** Description */
  desc?: string;
}

export type EntitySchema = Record<string, ColumnDef>;

// ─── Members ───────────────────────────────

export const members: EntitySchema = {
  id:            { server: false, local: true,  direction: 'none',     localType: 'string', desc: 'Local UUID PK' },
  server_id:     { server: false, local: true,  direction: 'none',     localType: 'number | null', desc: 'Server BIGSERIAL id' },
  client_id:     { server: true,  local: false, direction: 'both',    serverType: 'UUID', desc: 'Server-side correlation key' },
  name:          { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  relationship:  { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  user_id:       { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string', desc: 'RLS owner' },
  updated_at:    { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string', desc: 'LWW timestamp' },
  deleted_at:    { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at', desc: 'Soft-delete' },
  sync_status:   { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'", desc: 'Local-only sync state' },
  _deleted:      { server: false, local: true,  direction: 'none',    localType: 'boolean', desc: 'Local-only soft-delete flag' },
};

// ─── Accounts ──────────────────────────────

export const accounts: EntitySchema = {
  id:              { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:       { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:       { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  name:            { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  type:            { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: "'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group'" },
  member_id:       { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'number | null', desc: 'FK to members.id (server number)' },
  parent_id:       { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'number | null', desc: 'FK to accounts.id (server number)' },
  color:           { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  archived:        { server: true,  local: true,  direction: 'both',    serverType: 'INTEGER', localType: 'number' },
  initial_balance: { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  current_balance: { server: false, local: true,  direction: 'none',    localType: 'number', desc: 'Derived locally, never pushed' },
  currency:        { server: true,  local: true,  direction: 'both',    serverType: 'TEXT DEFAULT USD', localType: 'string' },
  user_id:         { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:      { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:      { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:     { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:        { server: false, local: true,  direction: 'none',    localType: 'boolean' },
  // Display-only fields (returned by server joins, not stored in table)
  member_name:     { server: false, local: true,  direction: 'pull',    localType: 'string', desc: 'Display field from server join' },
  parent_name:     { server: false, local: true,  direction: 'pull',    localType: 'string', desc: 'Display field from server join' },
};

// ─── Transactions ──────────────────────────

export const transactions: EntitySchema = {
  id:                   { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:            { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:            { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  account_id:           { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string', desc: 'FK — server number, local UUID' },
  date:                 { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  particulars:          { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  category:             { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  amount:               { server: true,  local: true,  direction: 'both',    serverType: 'NUMERIC', localType: 'number' },
  type:                 { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: "'normal' | 'transfer'" },
  linked_transaction_id: { server: true,  local: true,  direction: 'both',   serverType: 'BIGINT', localType: 'string | null', desc: 'FK — server number, local UUID' },
  summary:              { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string | null' },
  user_id:              { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:           { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:           { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:          { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:             { server: false, local: true,  direction: 'none',    localType: 'boolean' },
  // Display fields
  linked_account_name:  { server: false, local: true,  direction: 'pull',    localType: 'string', desc: 'Display field from server' },
};

// ─── Loans ─────────────────────────────────

export const loans: EntitySchema = {
  id:                   { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:            { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:            { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  lender_account_id:    { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string', desc: 'FK — server number, local UUID' },
  borrower_account_id:  { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string | null', desc: 'FK — server number, local UUID' },
  borrower_name:        { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string | null' },
  amount:               { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  remaining:            { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  date_given:           { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  due_date:             { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string | null' },
  interest_rate:        { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number | null' },
  particulars:          { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  status:               { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: "'active' | 'settled' | 'defaulted'" },
  settled_date:         { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string | null' },
  user_id:              { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:           { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:           { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:          { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:             { server: false, local: true,  direction: 'none',    localType: 'boolean' },
  // Display fields
  lender_name:          { server: false, local: true,  direction: 'pull',    localType: 'string', desc: 'Display field from server join' },
  borrower_account_name: { server: false, local: true, direction: 'pull',   localType: 'string', desc: 'Display field from server join' },
};

// ─── Loan Settlements ──────────────────────

export const loan_settlements: EntitySchema = {
  id:             { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:      { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:      { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  loan_id:        { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string', desc: 'FK — server number, local UUID' },
  amount:         { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  date:           { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  notes:          { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  transaction_id: { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string | null', desc: 'FK — server number, local UUID' },
  user_id:        { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:     { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:     { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:    { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:       { server: false, local: true,  direction: 'none',    localType: 'boolean' },
};

// ─── Investments ───────────────────────────

export const investments: EntitySchema = {
  id:             { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:      { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:      { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  account_id:     { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string', desc: 'FK — server number, local UUID' },
  principal:      { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  date:           { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  user_id:        { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:     { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:     { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:    { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:       { server: false, local: true,  direction: 'none',    localType: 'boolean' },
  // Display fields
  account_name:   { server: false, local: true,  direction: 'pull',    localType: 'string', desc: 'Display field from server join' },
};

// ─── Investment Returns ────────────────────

export const investment_returns: EntitySchema = {
  id:             { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:      { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:      { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  investment_id:  { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'string', desc: 'FK — server number, local UUID' },
  date:           { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  amount:         { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number' },
  percentage:     { server: true,  local: true,  direction: 'both',    serverType: 'REAL', localType: 'number | null' },
  user_id:        { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:     { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:     { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:    { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:       { server: false, local: true,  direction: 'none',    localType: 'boolean' },
};

// ─── Budgets ───────────────────────────────

export const budgets: EntitySchema = {
  id:             { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:      { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:      { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  category:       { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  amount:         { server: true,  local: true,  direction: 'both',    serverType: 'NUMERIC', localType: 'number' },
  month:          { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string', desc: 'Format: YYYY-MM' },
  created_at:     { server: true,  local: true,  direction: 'pull',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  user_id:        { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:     { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:     { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:    { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:       { server: false, local: true,  direction: 'none',    localType: 'boolean' },
};

// ─── Recurring Transactions ────────────────

export const recurring_transactions: EntitySchema = {
  id:             { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:      { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:      { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  account_id:     { server: true,  local: true,  direction: 'both',    serverType: 'INTEGER', localType: 'string', desc: 'FK — server number, local UUID' },
  particulars:    { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  category:       { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  amount:         { server: true,  local: true,  direction: 'both',    serverType: 'NUMERIC', localType: 'number' },
  frequency:      { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string', desc: "'daily' | 'weekly' | 'monthly' | 'yearly'" },
  next_date:      { server: true,  local: true,  direction: 'both',    serverType: 'DATE', localType: 'string' },
  active:         { server: true,  local: true,  direction: 'both',    serverType: 'BOOLEAN', localType: 'boolean' },
  created_at:     { server: true,  local: true,  direction: 'pull',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  user_id:        { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:     { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:     { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:    { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:       { server: false, local: true,  direction: 'none',    localType: 'boolean' },
};

// ─── Groups ─────────────────────────────────

export const groups: EntitySchema = {
  id:                  { server: false, local: true,  direction: 'none',     localType: 'string' },
  server_id:           { server: false, local: true,  direction: 'none',     localType: 'number | null' },
  client_id:           { server: true,  local: false, direction: 'both',    serverType: 'UUID' },
  name:                { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  type:                { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  member_id:           { server: true,  local: true,  direction: 'both',    serverType: 'BIGINT', localType: 'number | null', desc: 'FK — server number' },
  color:               { server: true,  local: true,  direction: 'both',    serverType: 'TEXT', localType: 'string' },
  user_id:             { server: true,  local: true,  direction: 'pull',    serverType: 'UUID', localType: 'string' },
  updated_at:          { server: true,  local: true,  direction: 'both',    serverType: 'TIMESTAMPTZ', localType: 'string' },
  deleted_at:          { server: true,  local: true,  direction: 'map',     serverType: 'TIMESTAMPTZ', localType: 'string | null', transform: '_deleted↔deleted_at' },
  sync_status:         { server: false, local: true,  direction: 'none',    localType: "'pending' | 'synced' | 'conflict'" },
  _deleted:            { server: false, local: true,  direction: 'none',    localType: 'boolean' },
  // Display / computed fields
  member_name:         { server: false, local: true,  direction: 'pull',    localType: 'string' },
  child_count:         { server: false, local: true,  direction: 'pull',    localType: 'number' },
  accumulated_balance: { server: false, local: true,  direction: 'none',    localType: 'number', desc: 'Derived locally' },
  children:            { server: false, local: true,  direction: 'none',    localType: 'Array<{id:number; name:string; type:string; current_balance:number}>' },
};

// ─── Map of all entities ───────────────────

export const schemas: Record<string, EntitySchema> = {
  members,
  accounts,
  transactions,
  loans,
  loan_settlements,
  investments,
  investment_returns,
  budgets,
  recurring_transactions,
  groups,
};

export type EntityName =
  | 'members' | 'accounts' | 'transactions' | 'loans'
  | 'loan_settlements' | 'investments' | 'investment_returns'
  | 'budgets' | 'recurring_transactions' | 'groups';

export const ALL_ENTITIES: EntityName[] = [
  'members', 'accounts', 'transactions', 'loans',
  'loan_settlements', 'investments', 'investment_returns',
  'budgets', 'recurring_transactions', 'groups',
];

/** Fields that should never be in a push payload */
export function getPushFieldNames(entity: EntityName): string[] {
  const schema = schemas[entity];
  if (!schema) return [];
  return Object.entries(schema)
    .filter(([_, def]) => def.direction === 'push' || def.direction === 'both')
    .map(([name]) => name);
}

/** Fields that should be stripped from push payloads */
export function getLocalOnlyFieldNames(entity: EntityName): string[] {
  const schema = schemas[entity];
  if (!schema) return [];
  return Object.entries(schema)
    .filter(([_, def]) => def.direction === 'none')
    .map(([name]) => name);
}
