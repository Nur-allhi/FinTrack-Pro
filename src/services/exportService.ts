import { localDb, LocalRecord, LocalMember, LocalAccount, LocalTransaction, LocalLoan, LocalLoanSettlement, LocalInvestment, LocalInvestmentReturn, LocalGroup, LocalBudget, LocalRecurringTransaction } from './localDb';
import { authService } from './authService';

export interface ExportData {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    members: Array<Record<string, unknown>>;
    accounts: Array<Record<string, unknown>>;
    transactions: Array<Record<string, unknown>>;
    loans: Array<Record<string, unknown>>;
    loan_settlements: Array<Record<string, unknown>>;
    investments: Array<Record<string, unknown>>;
    investment_returns: Array<Record<string, unknown>>;
    groups: Array<Record<string, unknown>>;
    budgets: Array<Record<string, unknown>>;
    recurring_transactions: Array<Record<string, unknown>>;
  };
}

function stripInternalFields(record: LocalRecord): Record<string, unknown> {
  const { sync_status, _deleted, server_id, updated_at, ...rest } = record as unknown as Record<string, unknown>;
  return rest;
}

export async function exportLocalData(): Promise<ExportData> {
  const [
    members,
    accounts,
    transactions,
    loans,
    loanSettlements,
    investments,
    investmentReturns,
    groups,
    budgets,
    recurringTransactions,
  ] = await Promise.all([
    localDb.getMembers(),
    localDb.getAccounts(),
    localDb.getTransactions(),
    localDb.getLoans(),
    localDb.getLoanSettlements(),
    localDb.getInvestments(),
    localDb.getInvestmentReturns(),
    localDb.getGroups(),
    localDb.getBudgets(),
    localDb.getRecurringTransactions(),
  ]);

  // Get user ID or guest ID
  let userId = 'guest';
  try {
    const session = await authService.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      userId = await localDb.getOrCreateGuestId();
    }
  } catch {
    userId = await localDb.getOrCreateGuestId();
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      members: members.map(stripInternalFields),
      accounts: accounts.map(stripInternalFields),
      transactions: transactions.map(stripInternalFields),
      loans: loans.map(stripInternalFields),
      loan_settlements: loanSettlements.map(stripInternalFields),
      investments: investments.map(stripInternalFields),
      investment_returns: investmentReturns.map(stripInternalFields),
      groups: groups.map(stripInternalFields),
      budgets: budgets.map(stripInternalFields),
      recurring_transactions: recurringTransactions.map(stripInternalFields),
    },
  };
}

export function downloadJson(data: ExportData, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importLocalData(data: ExportData): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  
  // Helper to import an array of records with local-wins conflict resolution
  async function importRecords<T extends LocalRecord>(
    getter: () => Promise<T[]>,
    putter: (records: T[]) => Promise<void>,
    records: Record<string, unknown>[],
    entityType: string
  ) {
    try {
      const existing = await getter();
      const existingIds = new Set(existing.map(r => r.id));
      const toImport: T[] = [];
      for (const rec of records) {
        if (existingIds.has(rec.id as string)) {
          result.skipped++;
          continue;
        }
        // Add internal fields
        const record = {
          ...rec,
          updated_at: new Date().toISOString(),
          sync_status: 'pending' as const,
          _deleted: false,
        } as unknown as T;
        toImport.push(record);
      }
      if (toImport.length > 0) {
        await putter(toImport);
        result.imported += toImport.length;
      }
    } catch (err) {
      result.errors.push(`${entityType}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  await importRecords(
    localDb.getMembers.bind(localDb),
    localDb.putMembers.bind(localDb),
    data.data.members,
    'members'
  );
  await importRecords(
    localDb.getAccounts.bind(localDb),
    localDb.putAccounts.bind(localDb),
    data.data.accounts,
    'accounts'
  );
  await importRecords(
    localDb.getTransactions.bind(localDb),
    localDb.putTransactions.bind(localDb),
    data.data.transactions,
    'transactions'
  );
  await importRecords(
    localDb.getLoans.bind(localDb),
    localDb.putLoans.bind(localDb),
    data.data.loans,
    'loans'
  );
  // loan_settlements, investments, investment_returns, groups, budgets, recurring_transactions
  // These have simpler import (no conflict check needed for settlements/returns)
  // We'll just put them if they don't exist
  // For simplicity, we'll import all (overwrite) since they're child entities
  // But we should still check existence for groups, budgets, recurring_transactions
  // Let's implement a generic import for each
  const simpleImport = async <T extends LocalRecord>(
    getter: () => Promise<T[]>,
    putter: (records: T[]) => Promise<void>,
    records: Record<string, unknown>[],
    entityType: string
  ) => {
    try {
      const existing = await getter();
      const existingIds = new Set(existing.map(r => r.id));
      const toImport: T[] = [];
      for (const rec of records) {
        if (existingIds.has(rec.id as string)) {
          result.skipped++;
          continue;
        }
        const record = {
          ...rec,
          updated_at: new Date().toISOString(),
          sync_status: 'pending' as const,
          _deleted: false,
        } as unknown as T;
        toImport.push(record);
      }
      if (toImport.length > 0) {
        await putter(toImport);
        result.imported += toImport.length;
      }
    } catch (err) {
      result.errors.push(`${entityType}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  await simpleImport(
    localDb.getLoanSettlements.bind(localDb),
    localDb.putLoanSettlements.bind(localDb),
    data.data.loan_settlements,
    'loan_settlements'
  );
  await simpleImport(
    localDb.getInvestments.bind(localDb),
    localDb.putInvestments.bind(localDb),
    data.data.investments,
    'investments'
  );
  await simpleImport(
    localDb.getInvestmentReturns.bind(localDb),
    localDb.putInvestmentReturns.bind(localDb),
    data.data.investment_returns,
    'investment_returns'
  );
  await simpleImport(
    localDb.getGroups.bind(localDb),
    localDb.putGroups.bind(localDb),
    data.data.groups,
    'groups'
  );
  await simpleImport(
    localDb.getBudgets.bind(localDb),
    localDb.putBudgets.bind(localDb),
    data.data.budgets,
    'budgets'
  );
  await simpleImport(
    localDb.getRecurringTransactions.bind(localDb),
    localDb.putRecurringTransactions.bind(localDb),
    data.data.recurring_transactions,
    'recurring_transactions'
  );
  
  return result;
}