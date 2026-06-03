import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'fintrack_local';
const DB_VERSION = 1;

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface LocalRecord {
  id: string;
  updated_at: string;
  sync_status: SyncStatus;
  _deleted: boolean;
}

export interface LocalMember extends LocalRecord {
  server_id?: number | null;
  name: string;
  relationship: string;
}

export interface LocalAccount extends LocalRecord {
  server_id?: number | null;
  name: string;
  type: string;
  member_id: string | null;
  parent_id: string | null;
  color: string;
  archived: number;
  initial_balance: number;
  current_balance: number;
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
  status: string;
  settled_date: string | null;
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
}

export interface LocalInvestmentReturn extends LocalRecord {
  server_id?: number | null;
  investment_id: string;
  date: string;
  amount: number;
  percentage: number | null;
}

export interface LocalGroup extends LocalRecord {
  server_id?: number | null;
  name: string;
  type: string;
  member_id: string | null;
  color: string;
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
  frequency: string;
  next_date: string;
  active: boolean;
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
      upgrade(db) {
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
              }
              if (name === 'transactions') {
                store.createIndex('account_id', 'account_id');
              }
            }
          }
        }
      },
    });
  }
  return dbPromise;
}

function now(): string {
  return new Date().toISOString();
}

type EntityName = 'members' | 'accounts' | 'transactions' | 'loans'
  | 'loan_settlements' | 'investments' | 'investment_returns'
  | 'groups' | 'budgets' | 'recurring_transactions';

async function putAll<T extends LocalRecord>(store: EntityName, records: T[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  for (const r of records) {
    tx.store.put(r);
  }
  await tx.done;
}

async function getAllVisible<T extends LocalRecord>(store: EntityName): Promise<T[]> {
  const db = await getDB();
  const all = await db.getAll(store);
  return all.filter(r => !r._deleted);
}

async function getUnsynced<T extends LocalRecord>(store: EntityName): Promise<T[]> {
  const db = await getDB();
  const all = await db.getAll(store);
  return all.filter(r => r.sync_status === 'pending' && !r._deleted);
}

async function put<T extends LocalRecord>(store: EntityName, record: T): Promise<void> {
  const db = await getDB();
  await db.put(store, record);
}

async function remove(store: EntityName, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(store, id);
}

async function markSynced<T extends LocalRecord>(store: EntityName, ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  for (const id of ids) {
    const record = await tx.store.get(id);
    if (record) {
      record.sync_status = 'synced';
      tx.store.put(record);
    }
  }
  await tx.done;
}

export const localDb = {
  // Members
  async getMembers(): Promise<LocalMember[]> { return getAllVisible('members'); },
  async getUnsyncedMembers(): Promise<LocalMember[]> { return getUnsynced('members'); },
  async putMember(record: LocalMember): Promise<void> { await put('members', record); },
  async putMembers(records: LocalMember[]): Promise<void> { await putAll('members', records); },
  async deleteMember(id: string): Promise<void> { await remove('members', id); },
  async markMembersSynced(ids: string[]): Promise<void> { await markSynced('members', ids); },

  // Accounts
  async getAccounts(): Promise<LocalAccount[]> { return getAllVisible('accounts'); },
  async getUnsyncedAccounts(): Promise<LocalAccount[]> { return getUnsynced('accounts'); },
  async putAccount(record: LocalAccount): Promise<void> { await put('accounts', record); },
  async putAccounts(records: LocalAccount[]): Promise<void> { await putAll('accounts', records); },
  async deleteAccount(id: string): Promise<void> { await remove('accounts', id); },
  async markAccountsSynced(ids: string[]): Promise<void> { await markSynced('accounts', ids); },

  // Transactions
  async getTransactions(accountId?: string): Promise<LocalTransaction[]> {
    if (accountId) {
      const db = await getDB();
      const all = await db.getAllFromIndex('transactions', 'account_id', accountId);
      return all.filter(r => !r._deleted);
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
    const db = await getDB();
    return (await db.get('metadata', key)) as unknown;
  },
  async setMeta(key: string, value: unknown): Promise<void> {
    const db = await getDB();
    await db.put('metadata', value as Record<string, unknown>, key);
  },

  // Bulk operations
  async getAllUnsynced(): Promise<LocalRecord[]> {
    const [members, accounts, transactions, loans] = await Promise.all([
      this.getUnsyncedMembers(),
      this.getUnsyncedAccounts(),
      this.getUnsyncedTransactions(),
      this.getUnsyncedLoans(),
    ]);
    return [...members, ...accounts, ...transactions, ...loans];
  },

  async getDeletedItems(): Promise<{ entity_type: string; entity_label: string; id: string; deleted_at: string; summary: string; server_id?: number | null }[]> {
    const db = await getDB();
    const results: { entity_type: string; entity_label: string; id: string; deleted_at: string; summary: string; server_id?: number | null }[] = [];
    const stores = [
      { name: 'transactions' as EntityName, label: 'Transaction' },
      { name: 'accounts' as EntityName, label: 'Account' },
      { name: 'loans' as EntityName, label: 'Loan' },
    ];
    for (const { name, label } of stores) {
      const all = await db.getAll(name);
      for (const r of all) {
        if (r._deleted) {
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
  },

  async restoreItem(entityType: string, id: string): Promise<void> {
    const db = await getDB();
    const storeName = entityType as EntityName;
    const record = await db.get(storeName, id);
    if (record) {
      record._deleted = false;
      record.sync_status = 'pending';
      record.updated_at = now();
      await db.put(storeName, record);
    }
  },

  async permanentDelete(entityType: string, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(entityType as EntityName, id);
  },

  async emptyBin(entityType?: string): Promise<void> {
    const db = await getDB();
    const stores: EntityName[] = entityType
      ? [entityType as EntityName]
      : ['transactions', 'accounts', 'loans'];
    for (const s of stores) {
      const all = await db.getAll(s);
      for (const r of all) {
        if (r._deleted) {
          await db.delete(s, r.id);
        }
      }
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
    const db = await getDB();
    const stores: EntityName[] = [
      'members', 'accounts', 'transactions', 'loans',
      'loan_settlements', 'investments', 'investment_returns',
      'groups', 'budgets', 'recurring_transactions'
    ];
    for (const s of stores) {
      await db.clear(s);
    }
  },

  async getSettings(): Promise<Record<string, unknown> | undefined> {
    const db = await getDB();
    return db.get('metadata', 'app_settings');
  },

  async setSettings(settings: Record<string, unknown>): Promise<void> {
    const db = await getDB();
    await db.put('metadata', settings, 'app_settings');
  },
};
