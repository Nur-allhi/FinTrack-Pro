import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loan, Account } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useToast } from './Toast';
import { localDb, LocalLoan } from '../services/localDb';
import { generateId } from '../utils/ids';
import LoanForm, { LoanFormState } from './LoanForm';
import LoanGroupCard, { LoanGroup } from './LoanGroupCard';
import SettleModal from './SettleModal';
import LoanFilters from './LoanFilters';

interface LoanManagerProps {
  accounts: Account[];
  onUpdate: () => void;
  currency: string;
}

export default function LoanManager({ accounts, onUpdate, currency }: LoanManagerProps) {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [groupingMode, setGroupingMode] = useState<'pair' | 'borrower'>('pair');
  const [showForm, setShowForm] = useState(false);
  const [loanType, setLoanType] = useState<'inter_account' | 'person'>('person');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settleModal, setSettleModal] = useState<{ id: number; borrowerName: string; amount: number; remaining: number } | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleError, setSettleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LoanFormState>({
    lender_account_id: '', borrower_account_id: '', borrower_name: '', amount: '',
    date_given: format(new Date(), 'yyyy-MM-dd'), due_date: '', interest_rate: '', particulars: ''
  });
  const isWriting = useRef(false);

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
    lender_name: undefined,
    borrower_account_name: undefined,
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

  const resetForm = () => {
    setForm({ lender_account_id: '', borrower_account_id: '', borrower_name: '', amount: '', date_given: format(new Date(), 'yyyy-MM-dd'), due_date: '', interest_rate: '', particulars: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loanType === 'inter_account' && form.lender_account_id === form.borrower_account_id) { toast("Lender and borrower accounts must be different.", 'error'); return; }
    if (loanType === 'person' && !form.lender_account_id) { toast("Select an account.", 'error'); return; }
    if (isWriting.current) return;
    isWriting.current = true;
    try {
      const borrowerName = loanType === 'person' ? (form.borrower_name || form.particulars) : null;
      if (loanType === 'person' && !borrowerName) { toast("Enter a borrower name.", 'error'); isWriting.current = false; return; }
      const amount = parseFloat(form.amount);
      const record: LocalLoan = {
        id: generateId(),
        lender_account_id: form.lender_account_id,
        borrower_account_id: loanType === 'inter_account' ? form.borrower_account_id : null,
        borrower_name: borrowerName,
        amount,
        remaining: amount,
        date_given: form.date_given,
        due_date: form.due_date || null,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        particulars: form.particulars,
        status: 'active',
        settled_date: null,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
        _deleted: false,
      };
      await localDb.putLoan(record);
      toast("Loan created.", 'success');
      setShowForm(false); resetForm(); fetchLoans(); onUpdate();
    } catch { toast("Failed to create loan.", 'error'); } finally { isWriting.current = false; }
  };

  const handleSettleOpen = (loan: Loan) => {
    const borrowerDisplay = loan.borrower_name || loan.borrower_account_name || `Account #${loan.borrower_account_id}`;
    setSettleModal({ id: loan.id, borrowerName: borrowerDisplay, amount: loan.amount, remaining: loan.remaining });
    setSettleAmount(String(loan.remaining)); setSettleError('');
  };

  const handleSettleSubmit = async () => {
    if (!settleModal) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) { setSettleError("Enter a valid amount."); return; }
    if (amount > settleModal.remaining) { setSettleError(`Cannot exceed remaining amount (${settleModal.remaining}).`); return; }
    setSettlingId(settleModal.id);
    try {
      const localLoans = await localDb.getLoans();
      const local = localLoans.find(l => l.server_id === settleModal.id);
      if (local) {
        const newRemaining = local.remaining - amount;
        const isSettled = newRemaining <= 0;
        await localDb.putLoan({
          ...local,
          remaining: Math.max(0, newRemaining),
          status: isSettled ? 'settled' : 'active',
          settled_date: isSettled ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        });
        if (isSettled) toast("Loan fully settled.", 'success');
        else toast(`Settlement recorded. Remaining: ${newRemaining}`, 'success');
      }
      setSettleModal(null); setSettleAmount(''); fetchLoans(); onUpdate();
    } catch { toast("Failed to settle loan.", 'error'); } finally { setSettlingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this loan record?")) return;
    setDeletingId(id);
    try {
      const localLoans = await localDb.getLoans();
      const local = localLoans.find(l => l.server_id === id);
      if (local) {
        await localDb.putLoan({ ...local, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
      }
      toast("Loan deleted.", 'success'); fetchLoans(); onUpdate();
    }
    catch { toast("Failed to delete loan.", 'error'); } finally { setDeletingId(null); }
  };

  const openEdit = (loan: Loan) => {
    setEditingId(loan.id); setLoanType(loan.borrower_name ? 'person' : 'inter_account');
    setForm({ lender_account_id: String(loan.lender_account_id), borrower_account_id: loan.borrower_account_id ? String(loan.borrower_account_id) : '', borrower_name: loan.borrower_name || '', amount: String(loan.amount), date_given: loan.date_given, due_date: loan.due_date || '', interest_rate: loan.interest_rate ? String(loan.interest_rate) : '', particulars: loan.particulars });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingId) return;
    try {
      const localLoans = await localDb.getLoans();
      const local = localLoans.find(l => l.server_id === editingId);
      if (local) {
        await localDb.putLoan({
          ...local,
          borrower_name: loanType === 'person' ? (form.borrower_name || null) : local.borrower_name,
          due_date: form.due_date || null,
          interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
          particulars: form.particulars,
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        });
      }
      toast("Loan updated.", 'success'); setShowForm(false); setEditingId(null); resetForm(); fetchLoans(); onUpdate();
    } catch { toast("Failed to update loan.", 'error'); }
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

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm(); };

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
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 self-start">
          <Plus className="w-4 md:w-5 h-4 md:h-5" /> New Loan
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="overflow-hidden"
          >
            <LoanForm editingId={editingId} loanType={loanType} form={form} loading={loading} accounts={accounts} onFormChange={setForm} onLoanTypeChange={(t) => { setLoanType(t); setForm({ ...form, borrower_account_id: '', borrower_name: '' }); }} onSubmit={editingId ? handleUpdate : handleCreate} onCancel={closeForm} />
          </motion.div>
        )}
      </AnimatePresence>

      <LoanFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} groupingMode={groupingMode} setGroupingMode={setGroupingMode} />

      {loading && groupedLoans.length === 0 && (
        <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline"><Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
      )}
      {!loading && groupedLoans.length === 0 && (
        <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline text-muted font-medium italic">No loans found.</div>
      )}

      <div className="space-y-4">
        {groupedLoans.map(group => (
          <LoanGroupCard key={group.key} group={group} currency={currency} settlingId={settlingId} deletingId={deletingId} onSettleOpen={handleSettleOpen} onEdit={openEdit} onDelete={handleDelete} onRefresh={() => fetchLoans()} groupingMode={groupingMode} />
        ))}
      </div>

      <SettleModal open={!!settleModal} borrowerName={settleModal?.borrowerName || ''} amount={settleModal?.amount || 0} remaining={settleModal?.remaining || 0} currency={currency} settleAmount={settleAmount} setSettleAmount={setSettleAmount} settleError={settleError} setSettleError={setSettleError} onSettle={handleSettleSubmit} onCancel={() => { setSettleModal(null); setSettleAmount(''); setSettleError(''); }} settling={settlingId !== null} />
    </div>
  );
}
