import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'ledger_cache';
const DB_VERSION = 1;
const DEFAULT_TTL = 5 * 60 * 1000;

interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

interface LedgerDB {
  members: {
    key: string;
    value: CachedEntry<any[]>;
  };
  accounts: {
    key: string;
    value: CachedEntry<any[]>;
  };
  transactions: {
    key: string;
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

function isExpired(timestamp: number, ttl: number = DEFAULT_TTL): boolean {
  return Date.now() - timestamp > ttl;
}

export const cacheService = {
  async setMembers(data: any[]) {
    const db = await getDB();
    await db.put('members', { data, timestamp: Date.now() }, 'list');
  },

  async getMembers(ttl?: number) {
    const db = await getDB();
    const entry = await db.get('members', 'list');
    if (!entry) return null;
    if (isExpired(entry.timestamp, ttl)) {
      await db.delete('members', 'list');
      return null;
    }
    return entry.data;
  },

  async setAccounts(data: any[]) {
    const db = await getDB();
    await db.put('accounts', { data, timestamp: Date.now() }, 'list');
  },

  async getAccounts(ttl?: number) {
    const db = await getDB();
    const entry = await db.get('accounts', 'list');
    if (!entry) return null;
    if (isExpired(entry.timestamp, ttl)) {
      await db.delete('accounts', 'list');
      return null;
    }
    return entry.data;
  },

  async setTransactions(accountId: string, data: any[]) {
    const db = await getDB();
    await db.put('transactions', {
      accountId,
      data,
      timestamp: Date.now()
    }, accountId);
  },

  async getTransactions(accountId: string, ttl?: number) {
    const db = await getDB();
    const entry = await db.get('transactions', accountId);
    if (!entry) return null;
    if (isExpired(entry.timestamp, ttl)) {
      await db.delete('transactions', accountId);
      return null;
    }
    return entry.data;
  },

  async clearCache() {
    const db = await getDB();
    await db.clear('members');
    await db.clear('accounts');
    await db.clear('transactions');
    await db.clear('metadata');
  },

  async setSettings(settings: any) {
    const db = await getDB();
    await db.put('metadata', settings, 'app_settings');
  },

  async getSettings() {
    const db = await getDB();
    return db.get('metadata', 'app_settings');
  }
};
