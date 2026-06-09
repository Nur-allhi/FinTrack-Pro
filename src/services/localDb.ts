import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'fintrack_local';
const DB_VERSION = 2;

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface LocalRecord {
  id: string;
  updated_at: string;
  sync_status: SyncStatus;
  _deleted: boolean;
  created_at?: string;
}

export interface LocalMember extends LocalRecord {
  server_id?: number | null;
  name: string;
  relationship: string;
}

export interface LocalAccount extends LocalRecord {
  server_id?: number | null;
  name: string;
  type: 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group';
  member_id: number | string | null;
  parent_id: number | string | null;
  color: string;
  archived: number;
  initial_balance: number;
  current_balance: number;
  currency: string;
}

export interface LocalTransaction extends LocalRecord {
  server_id?: number | null;
  account_id: string;
  date: string;
  particulars: string;
  category: string;
  amount: number;
  type: 'normal' | 'transfer';
  linked_transaction_id: string | null;
  summary: string | null;
}

export interface LocalLoan extends LocalRecord {
  server_id?: number | null;
  lender_account_id: string;
  borrower_account_id: string | null;
  borrower_name: string | null;
  amount: number;
  remaining: number;
  date_given: string;
  due_date: string | null;
  interest_rate: number | null;
  particulars: string;
  status: 'active' | 'settled' | 'defaulted';
  settled_date: string | null;
  lender_name?: string;
  borrower_account_name?: string;
}

export interface LocalLoanSettlement extends LocalRecord {
  server_id?: number | null;
  loan_id: string;
  amount: number;
  date: string;
  notes: string;
  transaction_id: string | null;
}

export interface LocalInvestment extends LocalRecord {
  server_id?: number | null;
  account_id: string;
  principal: number;
  date: string;
  account_name?: string;
}

export interface LocalInvestmentReturn extends LocalRecord {
  server_id?: number | null;
  investment_id: string;
  date: string;
  amount: number;
  percentage: number | null;
}

export interface LocalGroupChild {
  id: number;
  name: string;
  type: string;
  member_name?: string;
  current_balance: number;
}

export interface LocalGroup extends LocalRecord {
  server_id?: number | null;
  name: string;
  type: string;
  member_id: number | string | null;
  color: string;
  child_count: number;
  accumulated_balance: number;
  children: LocalGroupChild[];
  member_name?: string;
}

export interface LocalBudget extends LocalRecord {
  server_id?: number | null;
  category: string;
  month: string;
  amount: number;
}

export interface LocalRecurringTransaction extends LocalRecord {
  server_id?: number | null;
  account_id: string;
  amount: number;
  particulars: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  active: boolean;
  created_at: string;
}

interface LocalDB {
  members: { key: string; value: LocalMember };
  accounts: { key: string; value: LocalAccount };
  transactions: { key: string; value: LocalTransaction };
  loans: { key: string; value: LocalLoan };
  loan_settlements: { key: string; value: LocalLoanSettlement };
  investments: { key: string; value: LocalInvestment };
  investment_returns: { key: string; value: LocalInvestmentReturn };
  groups: { key: string; value: LocalGroup };
  budgets: { key: string; value: LocalBudget };
  recurring_transactions: { key: string; value: LocalRecurringTransaction };
  metadata: { key: string; value: Record<string, unknown> };
}

let dbPromise: Promise<IDBPDatabase<LocalDB>> | null = null;

function getDB(): Promise<IDBPDatabase<LocalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LocalDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        const stores = [
          'members', 'accounts', 'transactions', 'loans',
          'loan_settlements', 'investments', 'investment_returns',
          'groups', 'budgets', 'recurring_transactions', 'metadata'
        ] as const;
        for (const name of stores) {
          if (!db.objectStoreNames.contains(name)) {
            if (name === 'metadata') {
              db.createObjectStore(name);
            } else {
              const store = db.createObjectStore(name, { keyPath: 'id' });
              store.createIndex('sync_status', 'sync_status');
              store.createIndex('_deleted', '_deleted');
              if (name === 'accounts') {
                store.createIndex('member_id', 'member_id');
                store.createIndex('parent_id', 'parent_id');
                store.createIndex('type', 'type');
              }
              if (name === 'transactions') {
                store.createIndex('account_id', 'account_id');
                store.createIndex('date', 'date');
                store.createIndex('category', 'category');
              }
              if (name === 'loans') {
                store.createIndex('lender_account_id', 'lender_account_id');
                store.createIndex('borrower_account_id', 'borrower_account_id');
                store.createIndex('status', 'status');
              }
              if (name === 'loan_settlements') {
                store.createIndex('loan_id', 'loan_id');
              }
              if (name === 'investments') {
                store.createIndex('account_id', 'account_id');
              }
              if (name === 'budgets') {
                store.createIndex('month', 'month');
                store.createIndex('category', 'category');
              }
              if (name === 'recurring_transactions') {
                store.createIndex('account_id', 'account_id');
                store.createIndex('next_date', 'next_date');
                store.createIndex('active', 'active');
              }
              if (name === 'groups') {
                store.createIndex('member_id', 'member_id');
              }
            }
          }
        }
        // Migration from v1 to v2: no data migration needed for new fields
        if (oldVersion < 2) {
          console.log('[localDb] Upgraded to v2 — new fields: currency, created_at, display fields');
        }
      },
    });
  }
  return dbPromise;
}

async function withDB<T>(fn: (db: IDBPDatabase<LocalDB>) => Promise<T>): Promise<T> {
  try {
    const db = await getDB();
    return await fn(db);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'InvalidStateError') {
      dbPromise = null;
      const db = await getDB();
      return await fn(db);
    }
    throw err;
  }
}

function now(): string {
  return new Date().toISOString();
}

export type EntityName =
  | 'members' | 'accounts' | 'transactions' | 'loans'
  | 'loan_settlements' | 'investments' | 'investment_returns'
  | 'groups' | 'budgets' | 'recurring_transactions';

export type ChangeAction = 'put' | 'remove';
export type ChangeListener<T extends LocalRecord = LocalRecord> = (record: T | null, action: ChangeAction) => void;

const _listeners: Map<EntityName, Set<ChangeListener>> = new Map();

function notify<T extends LocalRecord>(store: EntityName, record: T | null, action: ChangeAction): void {
  const set = _listeners.get(store);
  if (!set || set.size === 0) return;
  for (const listener of set) {
    try {
      listener(record, action);
    } catch (e) {
      console.error(`localDb.onChange listener for ${store} threw:`, e);
    }
  }
}

function onChange<T extends LocalRecord>(store: EntityName, listener: ChangeListener<T>): () => void {
  let set = _listeners.get(store);
  if (!set) {
    set = new Set();
    _listeners.set(store, set);
  }
  set.add(listener as ChangeListener);
  return () => {
    set!.delete(listener as ChangeListener);
  };
}

async function putAll<T extends LocalRecord>(store: EntityName, records: T[]): Promise<void> {
  await withDB(async (db) => {
    const tx = db.transaction(store, 'readwrite');
    for (const r of records) {
      tx.store.put(r);
    }
    await tx.done;
  });
  for (const r of records) notify(store, r, 'put');
}

async function getAllVisible<T extends LocalRecord>(store: EntityName): Promise<T[]> {
  return withDB(async (db) => {
    const all = await db.getAll(store);
    return all.filter(r => !r._deleted);
  });
}

async function getAllRecords<T extends LocalRecord>(store: EntityName): Promise<T[]> {
  return withDB(async (db) => db.getAll(store));
}

async function getUnsynced<T extends LocalRecord>(store: EntityName): Promise<T[]> {
  return withDB(async (db) => {
    const all = await db.getAll(store);
    return all.filter(r => r.sync_status === 'pending' && !r._deleted);
  });
}

async function put<T extends LocalRecord>(store: EntityName, record: T): Promise<void> {
  await withDB(async (db) => db.put(store, record));
  notify(store, record, 'put');
}

async function remove(store: EntityName, id: string): Promise<void> {
  await withDB(async (db) => db.delete(store, id));
  notify(store, null, 'remove');
}

async function markSynced<T extends LocalRecord>(store: EntityName, ids: string[]): Promise<void> {
  await withDB(async (db) => {
    const tx = db.transaction(store, 'readwrite');
    for (const id of ids) {
      const record = await tx.store.get(id);
      if (record) {
        record.sync_status = 'synced';
        tx.store.put(record);
      }
    }
    await tx.done;
  });
}

async function markPushed(store: EntityName, mappings: { client_id: string; server_id: number }[]): Promise<void> {
  const updated: LocalRecord[] = [];
  await withDB(async (db) => {
    const tx = db.transaction(store, 'readwrite');
    for (const { client_id, server_id } of mappings) {
      const record = await tx.store.get(client_id);
      if (record) {
        (record as LocalRecord & { server_id?: number | null }).server_id = server_id;
        record.sync_status = 'synced';
        tx.store.put(record);
        updated.push(record);
      }
    }
    await tx.done;
  });
  for (const r of updated) notify(store, r, 'put');
}

async function adjustAccountBalance(accountLocalId: string, delta: number): Promise<LocalAccount | null> {
  const updated = await withDB(async (db) => {
    const account = await db.get('accounts', accountLocalId);
    if (!account) return null;
    account.current_balance = (account.current_balance || 0) + delta;
    account.updated_at = now();
    await db.put('accounts', account);
    return account;
  });
  if (updated) notify('accounts', updated, 'put');
  return updated;
}

export const localDb = {
  onChange,

  // Members
  async getMembers(): Promise<LocalMember[]> { return getAllVisible('members'); },
  async getUnsyncedMembers(): Promise<LocalMember[]> { return getUnsynced('members'); },
  async putMember(record: LocalMember): Promise<void> { await put('members', record); },
  async putMembers(records: LocalMember[]): Promise<void> { await putAll('members', records); },
  async deleteMember(id: string): Promise<void> { await remove('members', id); },
  async markMembersSynced(ids: string[]): Promise<void> { await markSynced('members', ids); },

  // Accounts
  async getAccounts(): Promise<LocalAccount[]> {
    return withDB(async (db) => {
      const all = await db.getAll('accounts');
      return all.filter(r => !r._deleted && r.type !== 'group');
    });
  },
  async getUnsyncedAccounts(): Promise<LocalAccount[]> { return getUnsynced('accounts'); },
  async putAccount(record: LocalAccount): Promise<void> { await put('accounts', record); },
  async putAccounts(records: LocalAccount[]): Promise<void> { await putAll('accounts', records); },
  async deleteAccount(id: string): Promise<void> { await remove('accounts', id); },
  async markAccountsSynced(ids: string[]): Promise<void> { await markSynced('accounts', ids); },

  // Transactions
  async getTransactions(accountId?: string): Promise<LocalTransaction[]> {
    if (accountId) {
      return withDB(async (db) => {
        const all = await db.getAllFromIndex('transactions', 'account_id', accountId);
        return all.filter(r => !r._deleted);
      });
    }
    return getAllVisible('transactions');
  },
  async getUnsyncedTransactions(): Promise<LocalTransaction[]> { return getUnsynced('transactions'); },
  async putTransaction(record: LocalTransaction): Promise<void> { await put('transactions', record); },
  async putTransactions(records: LocalTransaction[]): Promise<void> { await putAll('transactions', records); },
  async deleteTransaction(id: string): Promise<void> { await remove('transactions', id); },
  async markTransactionsSynced(ids: string[]): Promise<void> { await markSynced('transactions', ids); },

  // Loans
  async getLoans(): Promise<LocalLoan[]> { return getAllVisible('loans'); },
  async getUnsyncedLoans(): Promise<LocalLoan[]> { return getUnsynced('loans'); },
  async putLoan(record: LocalLoan): Promise<void> { await put('loans', record); },
  async putLoans(records: LocalLoan[]): Promise<void> { await putAll('loans', records); },
  async deleteLoan(id: string): Promise<void> { await remove('loans', id); },
  async markLoansSynced(ids: string[]): Promise<void> { await markSynced('loans', ids); },

  // Loan Settlements
  async getLoanSettlements(): Promise<LocalLoanSettlement[]> { return getAllVisible('loan_settlements'); },
  async putLoanSettlement(record: LocalLoanSettlement): Promise<void> { await put('loan_settlements', record); },
  async putLoanSettlements(records: LocalLoanSettlement[]): Promise<void> { await putAll('loan_settlements', records); },

  // Investments
  async getInvestments(): Promise<LocalInvestment[]> { return getAllVisible('investments'); },
  async putInvestment(record: LocalInvestment): Promise<void> { await put('investments', record); },
  async putInvestments(records: LocalInvestment[]): Promise<void> { await putAll('investments', records); },

  // Investment Returns
  async getInvestmentReturns(): Promise<LocalInvestmentReturn[]> { return getAllVisible('investment_returns'); },
  async putInvestmentReturn(record: LocalInvestmentReturn): Promise<void> { await put('investment_returns', record); },
  async putInvestmentReturns(records: LocalInvestmentReturn[]): Promise<void> { await putAll('investment_returns', records); },

  // Groups
  async getGroups(): Promise<LocalGroup[]> { return getAllVisible('groups'); },
  async putGroup(record: LocalGroup): Promise<void> { await put('groups', record); },
  async putGroups(records: LocalGroup[]): Promise<void> { await putAll('groups', records); },
  async deleteGroup(id: string): Promise<void> { await remove('groups', id); },

  // Budgets
  async getBudgets(): Promise<LocalBudget[]> { return getAllVisible('budgets'); },
  async putBudget(record: LocalBudget): Promise<void> { await put('budgets', record); },
  async putBudgets(records: LocalBudget[]): Promise<void> { await putAll('budgets', records); },

  // Recurring Transactions
  async getRecurringTransactions(): Promise<LocalRecurringTransaction[]> { return getAllVisible('recurring_transactions'); },
  async putRecurringTransaction(record: LocalRecurringTransaction): Promise<void> { await put('recurring_transactions', record); },
  async putRecurringTransactions(records: LocalRecurringTransaction[]): Promise<void> { await putAll('recurring_transactions', records); },
  async deleteRecurringTransaction(id: string): Promise<void> { await remove('recurring_transactions', id); },

  // Metadata
  async getMeta(key: string): Promise<unknown> {
    return withDB(async (db) => db.get('metadata', key) as unknown);
  },
  async setMeta(key: string, value: unknown): Promise<void> {
    await withDB(async (db) => db.put('metadata', value as Record<string, unknown>, key));
  },

  // Bulk operations
  async getAllRecords<T extends LocalRecord>(store: EntityName): Promise<T[]> {
    return getAllRecords<T>(store);
  },

  async getAllUnsynced(): Promise<LocalRecord[]> {
    const [members, accounts, transactions, loans] = await Promise.all([
      this.getUnsyncedMembers(),
      this.getUnsyncedAccounts(),
      this.getUnsyncedTransactions(),
      this.getUnsyncedLoans(),
    ]);
    return [...members, ...accounts, ...transactions, ...loans];
  },

  async getUnsyncedCount(): Promise<number> {
    const stores: EntityName[] = [
      'members', 'transactions', 'loans',
      'loan_settlements', 'investments', 'investment_returns',
      'budgets', 'recurring_transactions', 'groups',
    ];
    let count = 0;
    for (const s of stores) {
      const all = await getAllRecords(s);
      count += all.filter(r => r.sync_status === 'pending' && !r._deleted).length;
    }
    return count;
  },

  async getDeletedItems(): Promise<{ entity_type: string; entity_label: string; id: string; deleted_at: string; summary: string; server_id?: number | null }[]> {
    return withDB(async (db) => {
      const results: { entity_type: string; entity_label: string; id: string; deleted_at: string; summary: string; server_id?: number | null }[] = [];
      const stores = [
        { name: 'transactions' as EntityName, label: 'Transaction' },
        { name: 'accounts' as EntityName, label: 'Account' },
        { name: 'loans' as EntityName, label: 'Loan' },
        { name: 'members' as EntityName, label: 'Member' },
        { name: 'groups' as EntityName, label: 'Group' },
      ];
      for (const { name, label } of stores) {
        const all = await db.getAll(name);
        for (const r of all) {
          if (r._deleted && !(r as any)._bin_emptied) {
            const summary = 'name' in r ? (r as { name: string }).name : 'particulars' in r ? (r as { particulars: string }).particulars : label;
            results.push({
              entity_type: name,
              entity_label: label,
              id: r.id,
              deleted_at: r.updated_at,
              summary,
              server_id: 'server_id' in r ? (r as { server_id?: number | null }).server_id : null,
            });
          }
        }
      }
      return results.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    });
  },

  async restoreItem(entityType: string, id: string): Promise<void> {
    const storeName = entityType as EntityName;
    const record = await withDB(async (db) => db.get(storeName, id));
    if (record) {
      await put(storeName, { ...record, _deleted: false, sync_status: 'pending', updated_at: now() });
    }
  },

  async permanentDelete(entityType: string, id: string): Promise<void> {
    await remove(entityType as EntityName, id);
  },

  async isDeletedId(table: string, serverId: number): Promise<boolean> {
    const key = `tombstone:${table}:${serverId}`;
    const existing = await this.getMeta(key);
    return !!existing;
  },

  async addDeletedId(table: string, serverId: number): Promise<void> {
    const key = `tombstone:${table}:${serverId}`;
    await this.setMeta(key, new Date().toISOString());
  },

  async emptyBin(entityType?: string): Promise<void> {
    const stores: EntityName[] = entityType
      ? [entityType as EntityName]
      : ['transactions', 'accounts', 'loans', 'members', 'groups'];

    const toEmpty: { store: EntityName; record: LocalRecord }[] = [];
    for (const s of stores) {
      const all = await getAllRecords(s);
      for (const r of all) {
        if (r._deleted) toEmpty.push({ store: s, record: r });
      }
    }
    if (toEmpty.length === 0) return;

    // Mark as bin-emptied + pending (will push to server)
    const ts = now();
    for (const { store: s, record: r } of toEmpty) {
      r.sync_status = 'pending';
      r.updated_at = ts;
      (r as any)._bin_emptied = true;
      await put(s, r);
    }

    // Push to server — this must succeed so server gets deleted_at
    const { flushPending } = await import('./syncEngine');
    await flushPending();

    // Push succeeded: server has deleted_at. Hard-delete + tombstone.
    for (const { store: s, record: r } of toEmpty) {
      const sid = (r as any).server_id as number | undefined;
      if (sid != null) {
        await this.addDeletedId(s, sid);
      }
      await remove(s, r.id);
    }
  },

  async markAllSynced(): Promise<void> {
    const unsynced = await this.getAllUnsynced();
    const ids = unsynced.map(r => r.id);
    if (ids.length === 0) return;
    await Promise.all([
      markSynced('members', ids),
      markSynced('accounts', ids),
      markSynced('transactions', ids),
      markSynced('loans', ids),
    ]);
  },

  async clearAll(): Promise<void> {
    await withDB(async (db) => {
      const stores: EntityName[] = [
        'members', 'accounts', 'transactions', 'loans',
        'loan_settlements', 'investments', 'investment_returns',
        'groups', 'budgets', 'recurring_transactions'
      ];
      for (const s of stores) {
        await db.clear(s);
      }
    });
  },

  async getSettings(): Promise<Record<string, unknown> | undefined> {
    return withDB(async (db) => db.get('metadata', 'app_settings'));
  },

  async setSettings(settings: Record<string, unknown>): Promise<void> {
    await withDB(async (db) => db.put('metadata', settings, 'app_settings'));
  },

  async getOrCreateGuestId(): Promise<string> {
    return withDB(async (db) => {
      const existing = await db.get('metadata', 'guest_id') as { value: string } | undefined;
      if (existing?.value) return existing.value;
      const id = crypto.randomUUID();
      await db.put('metadata', { value: id }, 'guest_id');
      return id;
    });
  },

  async getTransactionCount(): Promise<number> {
    const db = await getDB();
    return db.count('transactions');
  },

  async adjustAccountBalance(accountLocalId: string, delta: number): Promise<LocalAccount | null> {
    return adjustAccountBalance(accountLocalId, delta);
  },

  async markPushed(store: EntityName, mappings: { client_id: string; server_id: number }[]): Promise<void> {
    return markPushed(store, mappings);
  },
};
