import React, { useState, useEffect, useMemo } from 'react';
import { Loan, Account, WriteOperation } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { localDb, LocalLoan } from '../services/localDb';
import LoanGroupCard, { LoanGroup } from './LoanGroupCard';
import LoanFilters from './LoanFilters';

interface LoanManagerProps {
  accounts: Account[];
  onWriteOperation: (op: WriteOperation) => void;
  currency: string;
}

export default function LoanManager({ accounts, onWriteOperation, currency }: LoanManagerProps) {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [groupingMode, setGroupingMode] = useState<'pair' | 'borrower'>('pair');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const toApiLoan = (r: LocalLoan): Loan => ({
    id: r.server_id ?? 0,
    lender_account_id: Number(r.lender_account_id),
    borrower_account_id: r.borrower_account_id ? Number(r.borrower_account_id) : null,
    borrower_name: r.borrower_name,
    amount: r.amount,
    remaining: r.remaining,
    date_given: r.date_given,
    due_date: r.due_date,
    interest_rate: r.interest_rate,
    particulars: r.particulars,
    status: r.status as 'active' | 'settled' | 'defaulted',
    settled_date: r.settled_date,
    lender_name: accounts.find(a => a.id === Number(r.lender_account_id))?.name,
    borrower_account_name: r.borrower_account_id
      ? accounts.find(a => a.id === Number(r.borrower_account_id))?.name
      : undefined,
  });

  const fetchLoans = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const local = await localDb.getLoans();
      setLoans(local.filter(l => l.status !== 'removed').map(toApiLoan));
    }
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => { fetchLoans(true); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this loan record?")) return;
    setDeletingId(id);
    try {
      const localLoans = await localDb.getLoans();
      const local = localLoans.find(l => l.server_id === id);
      if (local) {
        await localDb.putLoan({ ...local, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
      }
      toast("Loan deleted.", 'success'); fetchLoans();
    }
    catch { toast("Failed to delete loan.", 'error'); } finally { setDeletingId(null); }
  };

  const filteredLoans = statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter);

  const groupedLoans = useMemo((): LoanGroup[] => {
    const groupMap = new Map<string, Loan[]>();
    for (const loan of filteredLoans) {
      const borrowerId = loan.borrower_account_id ?? loan.borrower_name ?? 'Unknown';
      const key = groupingMode === 'pair' ? `${loan.lender_account_id}:${borrowerId}` : `${borrowerId}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(loan);
    }
    return Array.from(groupMap.entries())
      .map(([key, loans]) => {
        const sorted = [...loans].sort((a, b) => new Date(b.date_given).getTime() - new Date(a.date_given).getTime());
        const first = sorted[0];
        return { key, loans: sorted, borrowerName: first.borrower_name || first.borrower_account_name || `Account #${first.borrower_account_id}`, lenderName: first.lender_name || `Account #${first.lender_account_id}`, totalAmount: loans.reduce((s, l) => s + l.amount, 0), totalRemaining: loans.reduce((s, l) => s + l.remaining, 0), activeCount: loans.filter(l => l.status === 'active').length, latestDate: sorted[0].date_given } as LoanGroup;
      })
      .sort((a, b) => a.borrowerName.localeCompare(b.borrowerName));
  }, [filteredLoans, groupingMode]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="text-lg md:text-2xl lg:text-3xl font-normal text-ink tracking-tight">Loans</h3>
          <p className="text-xs md:text-sm text-muted font-medium">Track inter-account lending and borrowing.</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span><strong className="text-ink">{loans.filter(l => l.status === 'active').length}</strong> <span className="text-muted">active</span></span>
            <span className="text-hairline">|</span>
            <span>Total outstanding: <strong className="text-ink">{currency}{loans.filter(l => l.status === 'active').reduce((s, l) => s + l.remaining, 0).toLocaleString()}</strong></span>
          </div>
        </div>
        <button onClick={() => onWriteOperation({ type: 'loan_create' })} className="btn-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 self-start">
          <Plus className="w-4 md:w-5 h-4 md:h-5" /> New Loan
        </button>
      </div>

      <LoanFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} groupingMode={groupingMode} setGroupingMode={setGroupingMode} />

      {loading && groupedLoans.length === 0 && (
        <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline"><Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
      )}
      {!loading && groupedLoans.length === 0 && (
        <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline text-muted font-medium italic">No loans found.</div>
      )}

      <div className="space-y-4">
        {groupedLoans.map(group => (
          <LoanGroupCard key={group.key} group={group} currency={currency} settlingId={null} deletingId={deletingId} onSettleOpen={(loan) => onWriteOperation({ type: 'loan_settle', loan })} onEdit={(loan) => onWriteOperation({ type: 'loan_edit', loan })} onDelete={handleDelete} onRefresh={() => fetchLoans()} groupingMode={groupingMode} />
        ))}
      </div>
    </div>
  );
}
