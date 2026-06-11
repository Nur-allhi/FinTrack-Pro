import React, { useState, useEffect, useMemo } from 'react';
import { Loan, Account, WriteOperation } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { localDb, LocalLoan } from '../services/localDb';
import { authService } from '../services/authService';
import { flushPending } from '../services/syncEngine';
import LoanGroupCard, { LoanGroup } from './LoanGroupCard';
import LoanFilters from './LoanFilters';

interface LoanManagerProps {
  accounts: Account[];
  onWriteOperation: (op: WriteOperation) => void;
  currency: string;
  refreshCounter?: number;
}

export function loanDisplayId(r: { server_id?: number | null; id: string }): number {
  return r.server_id ?? -(Math.abs(hashStr(r.id)) || 1);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function accountDisplayId(a: { server_id?: number | null; id: string }): number {
  return a.server_id ?? -(Math.abs(hashStr(a.id)) || 1);
}

export function findLocalLoan(localLoans: { server_id?: number | null; id: string }[], id: number): { server_id?: number | null; id: string } | undefined {
  if (id > 0) {
    const byServerId = localLoans.find(l => l.server_id === id);
    if (byServerId) return byServerId;
  }
  return localLoans.find(l => l.server_id == null && loanDisplayId(l) === id);
}

export default function LoanManager({ accounts, onWriteOperation, currency, refreshCounter }: LoanManagerProps) {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('active');
  const [groupingMode, setGroupingMode] = useState<'pair' | 'borrower'>('pair');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLoans = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [local, localAccounts] = await Promise.all([
        localDb.getLoans(),
        localDb.getAccounts(),
      ]);
      const accountMap = new Map(localAccounts.map(a => [a.id, a]));
      setLoans(local.map(r => {
        const localLender = accountMap.get(r.lender_account_id);
        const localBorrower = r.borrower_account_id ? accountMap.get(r.borrower_account_id) : undefined;
        const lid = localLender ? accountDisplayId(localLender) : Number(r.lender_account_id);
        const bid = r.borrower_account_id
          ? (localBorrower ? accountDisplayId(localBorrower) : Number(r.borrower_account_id))
          : null;
        const lender = accounts.find(a => a.id === lid);
        const borrower = bid !== null ? accounts.find(a => a.id === bid) : undefined;
        return {
          id: loanDisplayId(r),
          _localId: r.id,
          lender_account_id: lid || lender?.id || 0,
          borrower_account_id: bid || borrower?.id || null,
          borrower_name: r.borrower_name,
          amount: r.amount,
          remaining: r.remaining,
          date_given: r.date_given,
          due_date: r.due_date,
          interest_rate: r.interest_rate,
          particulars: r.particulars,
          status: r.status as 'active' | 'settled' | 'defaulted',
          settled_date: r.settled_date,
          member_name: lender?.member_name || '',
          borrower_member_name: borrower?.member_name || '',
          lender_name: r.lender_name || localLender?.name || lender?.name,
          borrower_account_name: r.borrower_account_name || localBorrower?.name || borrower?.name,
        };
      }));
    }
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => { fetchLoans(true); }, [refreshCounter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this loan record?")) return;
    setDeletingId(id);
    try {
      const localLoans = await localDb.getLoans();
      const local = findLocalLoan(localLoans, id) as LocalLoan | undefined;
      if (!local) { toast("Loan not found.", 'error'); return; }

      const serverId = local.server_id;

      if (serverId != null && navigator.onLine) {
        try {
          const res = await authService.apiFetch(`/api/loans/${serverId}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            await localDb.putLoan({ ...local, _deleted: true, sync_status: 'synced', updated_at: new Date().toISOString() });
            toast("Loan deleted.", 'success');
            fetchLoans();
            return;
          }
          const isServerError = res.status >= 400 && res.status < 500;
          if (isServerError) {
            const body = await res.json().catch(() => ({}));
            toast(body?.error || "Server rejected deletion.", 'error');
            fetchLoans();
            return;
          }
        } catch {
          // Network error — fall through to soft-delete
        }
      }

      if (serverId == null) {
        await localDb.putLoan({ ...local, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
        toast("Loan deleted.", 'success');
        flushPending();
      } else {
        await localDb.putLoan({ ...local, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
        toast("Loan deleted (will sync when online).", 'info');
        flushPending();
      }
      fetchLoans();
    }
    catch { toast("Failed to delete loan.", 'error'); } finally { setDeletingId(null); }
  };

  const filteredLoans = statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter);

  const groupedLoans = useMemo((): LoanGroup[] => {
    const groupMap = new Map<string, Loan[]>();
    for (const loan of filteredLoans) {
      const key = groupingMode === 'pair'
        ? `${loan.lender_account_id}`
        : `${loan.borrower_account_id ?? loan.borrower_account_name ?? loan.borrower_name ?? 'Unknown'}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(loan);
    }
    return Array.from(groupMap.entries())
      .map(([key, loans]) => {
        const sorted = [...loans].sort((a, b) => new Date(b.date_given).getTime() - new Date(a.date_given).getTime());
        const first = sorted[0];
        const isPair = groupingMode === 'pair';
        const groupName = isPair
          ? (first.lender_name || `Account #${first.lender_account_id}`) + (first.member_name ? ` (${first.member_name})` : '')
          : (first.borrower_account_name
            ? first.borrower_account_name + (first.borrower_member_name ? ` (${first.borrower_member_name})` : '')
            : (first.borrower_name || (first.borrower_account_id ? `Account #${first.borrower_account_id}` : 'Unknown')));
        return { key, loans: sorted, groupName, lenderName: isPair ? undefined : first.lender_name, totalAmount: loans.reduce((s, l) => s + l.amount, 0), totalRemaining: loans.reduce((s, l) => s + l.remaining, 0), activeCount: loans.filter(l => l.status === 'active').length, latestDate: sorted[0].date_given } as LoanGroup;
      })
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
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
