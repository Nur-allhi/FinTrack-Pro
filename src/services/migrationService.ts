import { localDb, LocalMember, LocalAccount, LocalTransaction, LocalLoan } from './localDb';
import { authService } from './authService';

const TABLES = [
  'members', 'accounts', 'transactions', 'loans',
  'budgets', 'recurring_transactions',
] as const;

type TableName = typeof TABLES[number];

interface ServerRecord {
  id: number;
  client_id?: string | null;
  updated_at?: string;
  [key: string]: unknown;
}

// Check if migration is needed (no local data but server has records)
export async function isMigrationNeeded(): Promise<boolean> {
  const members = await localDb.getMembers();
  if (members.length > 0) return false;

  try {
    const res = await authService.apiFetch('/api/sync/initial', { method: 'POST' });
    if (!res.ok) return false;
    const data = await res.json();
    const totalRecords = Object.values(data.data as Record<string, unknown[]>)
      .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    return totalRecords > 0;
  } catch {
    return false;
  }
}

// Migrate server data to local: assign client_ids, store locally
export async function migrateServerData(): Promise<{ migrated: number; errors: number }> {
  let migrated = 0;
  let errors = 0;

  try {
    const res = await authService.apiFetch('/api/sync/initial', { method: 'POST' });
    if (!res.ok) return { migrated: 0, errors: 1 };

    const data = await res.json();

    // First pass: store members and accounts; build account server_id → local_id map
    const accountIdMap = new Map<number, string>();
    for (const table of ['members', 'accounts'] as const) {
      const rows = data.data?.[table] as ServerRecord[] | undefined;
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const recordsNeedingIds = rows.filter(r => !r.client_id);
      if (recordsNeedingIds.length > 0) {
        await assignClientIds(table, recordsNeedingIds);
      }

      const localRecords = rows.map(r => serverToLocal(table, r));
      await storeLocal(table, localRecords);
      migrated += rows.length;

      if (table === 'accounts') {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (r.client_id) accountIdMap.set(r.id, r.client_id);
          else accountIdMap.set(r.id, (localRecords[i] as { id: string }).id);
        }
      }
    }

    // Second pass: transactions and loans (need account id translation)
    for (const table of ['transactions', 'loans'] as const) {
      const rows = data.data?.[table] as ServerRecord[] | undefined;
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const recordsNeedingIds = rows.filter(r => !r.client_id);
      if (recordsNeedingIds.length > 0) {
        await assignClientIds(table, recordsNeedingIds);
      }

      const localRecords = rows.map(r => serverToLocal(table, r, accountIdMap));
      await storeLocal(table, localRecords);
      migrated += rows.length;
    }

    // Third pass: budgets/recurring (no special handling needed)
    for (const table of ['budgets', 'recurring_transactions'] as const) {
      const rows = data.data?.[table] as ServerRecord[] | undefined;
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const recordsNeedingIds = rows.filter(r => !r.client_id);
      if (recordsNeedingIds.length > 0) {
        await assignClientIds(table, recordsNeedingIds);
      }

      const localRecords = rows.map(r => serverToLocal(table, r));
      await storeLocal(table, localRecords);
      migrated += rows.length;
    }

    await localDb.setMeta('sync_timestamp', data.syncedAt || new Date().toISOString());
    await localDb.setMeta('migration_completed', true);
  } catch (err) {
    console.error('Migration failed:', err);
    errors++;
  }

  return { migrated, errors };
}

function serverToLocal(table: TableName, record: ServerRecord, accountIdMap?: Map<number, string>) {
  const base = {
    id: record.client_id || crypto.randomUUID(),
    server_id: record.id,
    created_at: (record.created_at as string) || undefined,
    updated_at: (record.updated_at as string) || new Date().toISOString(),
    sync_status: 'synced' as const,
    _deleted: false,
  };

  switch (table) {
    case 'members':
      return { ...base, name: record.name as string, relationship: (record.relationship as string) || '' } as LocalMember;
    case 'accounts':
      return {
        ...base,
        name: record.name as string,
        type: record.type as string,
        member_id: record.member_id as string | null,
        parent_id: record.parent_id as string | null,
        color: (record.color as string) || '#6B7280',
        archived: (record.archived as number) || 0,
        initial_balance: (record.initial_balance as number) || 0,
        current_balance: (record.current_balance as number) || 0,
      } as LocalAccount;
    case 'transactions':
      return {
        ...base,
        account_id: accountIdMap?.get(Number(record.account_id)) || String(record.account_id),
        date: record.date as string,
        particulars: record.particulars as string,
        category: (record.category as string) || 'Uncategorized',
        amount: record.amount as number,
        type: (record.type as 'normal' | 'transfer') || 'normal',
        linked_transaction_id: (record.linked_transaction_id as string) || null,
        summary: (record.summary as string) || null,
      } as LocalTransaction;
    case 'loans':
      return {
        ...base,
        lender_account_id: accountIdMap?.get(Number(record.lender_account_id)) || String(record.lender_account_id),
        borrower_account_id: record.borrower_account_id != null
          ? (accountIdMap?.get(Number(record.borrower_account_id)) || String(record.borrower_account_id))
          : null,
        borrower_name: (record.borrower_name as string) || null,
        amount: record.amount as number,
        remaining: record.remaining as number,
        date_given: record.date_given as string,
        due_date: (record.due_date as string) || null,
        interest_rate: (record.interest_rate as number) || null,
        particulars: (record.particulars as string) || '',
        status: (record.status as string) || 'active',
        settled_date: (record.settled_date as string) || null,
      } as LocalLoan;
    default:
      return { ...base, ...record } as never;
  }
}

async function storeLocal(table: TableName, records: unknown[]): Promise<void> {
  const putters: Record<TableName, (r: never[]) => Promise<void>> = {
    members: (r) => localDb.putMembers(r),
    accounts: (r) => localDb.putAccounts(r),
    transactions: (r) => localDb.putTransactions(r),
    loans: (r) => localDb.putLoans(r),
    budgets: async () => {},
    recurring_transactions: async () => {},
  };
  await putters[table](records as never[]);
}

async function assignClientIds(table: TableName, records: ServerRecord[]): Promise<void> {
  const client = await import('./authService').then(m => m.authService);
  for (const record of records) {
    const clientId = crypto.randomUUID();
    await client.apiFetch(`/api/${table}/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
    }).catch(() => {});
  }
}
