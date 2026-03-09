import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'ledger_cache';
const DB_VERSION = 1;

interface LedgerDB {
  members: any;
  accounts: any;
  transactions: {
    key: string; // accountId
    value: {
      accountId: string;
      data: any[];
      timestamp: number;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<LedgerDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<LedgerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('members');
        db.createObjectStore('accounts');
        db.createObjectStore('transactions');
        db.createObjectStore('metadata');
      },
    });
  }
  return dbPromise;
}

export const cacheService = {
  async setMembers(data: any[]) {
    const db = await getDB();
    await db.put('members', data, 'list');
  },

  async getMembers() {
    const db = await getDB();
    return db.get('members', 'list');
  },

  async setAccounts(data: any[]) {
    const db = await getDB();
    await db.put('accounts', data, 'list');
  },

  async getAccounts() {
    const db = await getDB();
    return db.get('accounts', 'list');
  },

  async setTransactions(accountId: string, data: any[]) {
    const db = await getDB();
    await db.put('transactions', {
      accountId,
      data,
      timestamp: Date.now()
    }, accountId);
  },

  async getTransactions(accountId: string) {
    const db = await getDB();
    const entry = await db.get('transactions', accountId);
    return entry ? entry.data : null;
  },

  async clearCache() {
    const db = await getDB();
    await db.clear('members');
    await db.clear('accounts');
    await db.clear('transactions');
  }
};
