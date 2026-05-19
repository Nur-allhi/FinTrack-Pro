import React, { useState, useEffect } from 'react';
import { Loan, Account } from '../types';
import { Plus, X, Handshake, CheckCircle2, ArrowRight, Loader2, Pencil, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import DatePicker from './DatePicker';
import Select from './Select';

interface LoanManagerProps {
  accounts: Account[];
  onUpdate: () => void;
  currency: string;
}

export default function LoanManager({ accounts, onUpdate, currency }: LoanManagerProps) {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [showForm, setShowForm] = useState(false);
  const [loanType, setLoanType] = useState<'inter_account' | 'person'>('person');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settleModal, setSettleModal] = useState<{ id: number; borrowerName: string; amount: number; remaining: number } | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleError, setSettleError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    lender_account_id: '',
    borrower_account_id: '',
    borrower_name: '',
    amount: '',
    date_given: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    interest_rate: '',
    particulars: ''
  });

  const fetchLoans = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await authService.apiFetch('/api/loans');
      if (res.ok) setLoans(await res.json());
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(true); }, []);

  const resetForm = () => {
    setForm({
      lender_account_id: '',
      borrower_account_id: '',
      borrower_name: '',
      amount: '',
      date_given: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      interest_rate: '',
      particulars: ''
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loanType === 'inter_account' && form.lender_account_id === form.borrower_account_id) {
      toast("Lender and borrower accounts must be different.", 'error');
      return;
    }
    if (loanType === 'person' && !form.lender_account_id) {
      toast("Select an account.", 'error');
      return;
    }
    setLoading(true);
    try {
      const body: any = {
        lender_account_id: Number(form.lender_account_id),
        amount: parseFloat(form.amount),
        date_given: form.date_given,
        due_date: form.due_date || null,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        particulars: form.particulars
      };
      if (loanType === 'person') {
        body.borrower_name = form.borrower_name || form.particulars;
        if (!body.borrower_name) {
          toast("Enter a borrower name.", 'error');
          setLoading(false);
          return;
        }
      } else {
        body.borrower_account_id = Number(form.borrower_account_id);
      }
      const res = await authService.apiFetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to create loan");
      toast("Loan created successfully.", 'success');
      setShowForm(false);
      resetForm();
      fetchLoans();
      onUpdate();
    } catch (err) {
      toast("Failed to create loan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (id: number) => {
    setSettlingId(id);
    try {
      const res = await authService.apiFetch(`/api/loans/${id}/settle`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to settle loan");
      toast("Loan marked as settled.", 'success');
      fetchLoans();
      onUpdate();
    } catch (err) {
      toast("Failed to settle loan.", 'error');
    } finally {
      setSettlingId(null);
    }
  };

  const handleSettleOpen = (loan: Loan) => {
    const borrowerDisplay = loan.borrower_name || loan.borrower_account_name || `Account #${loan.borrower_account_id}`;
    setSettleModal({ id: loan.id, borrowerName: borrowerDisplay, amount: loan.amount, remaining: loan.remaining });
    setSettleAmount(String(loan.remaining));
    setSettleError('');
  };

  const handleSettleSubmit = async () => {
    if (!settleModal) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      setSettleError("Enter a valid amount.");
      return;
    }
    if (amount > settleModal.remaining) {
      setSettleError(`Cannot exceed remaining amount (${settleModal.remaining}).`);
      return;
    }
    setSettlingId(settleModal.id);
    try {
      const res = await authService.apiFetch(`/api/loans/${settleModal.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error("Failed to settle loan");
      const data = await res.json();
      if (data.settled) {
        toast("Loan fully settled.", 'success');
      } else {
        toast(`Settlement recorded. Remaining: ${data.remaining}`, 'success');
      }
      setSettleModal(null);
      setSettleAmount('');
      fetchLoans();
      onUpdate();
    } catch (err) {
      toast("Failed to settle loan.", 'error');
    } finally {
      setSettlingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this loan record?")) return;
    setDeletingId(id);
    try {
      await authService.apiFetch(`/api/loans/${id}`, { method: 'DELETE' });
      toast("Loan deleted.", 'success');
      fetchLoans();
      onUpdate();
    } catch (err) {
      toast("Failed to delete loan.", 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (loan: Loan) => {
    setEditingId(loan.id);
    setLoanType(loan.borrower_name ? 'person' : 'inter_account');
    setForm({
      lender_account_id: String(loan.lender_account_id),
      borrower_account_id: loan.borrower_account_id ? String(loan.borrower_account_id) : '',
      borrower_name: loan.borrower_name || '',
      amount: String(loan.amount),
      date_given: loan.date_given,
      due_date: loan.due_date || '',
      interest_rate: loan.interest_rate ? String(loan.interest_rate) : '',
      particulars: loan.particulars
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await authService.apiFetch(`/api/loans/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_date: form.due_date || null,
          interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
          particulars: form.particulars
        })
      });
      if (!res.ok) throw new Error("Failed to update loan");
      toast("Loan updated successfully.", 'success');
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchLoans();
      onUpdate();
    } catch (err) {
      toast("Failed to update loan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter);
  const activeAccounts = accounts.filter(a => !a.archived);

  const accountOptions = activeAccounts.map(a => ({
    value: String(a.id),
    label: a.member_name ? `${a.name} · ${a.member_name}` : a.name
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="text-lg md:text-2xl lg:text-3xl font-normal text-ink tracking-tight">Loans</h3>
          <p className="text-xs md:text-sm text-muted font-medium">Track inter-account lending and borrowing.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 self-start">
          <Plus className="w-4 md:w-5 h-4 md:h-5" />
          New Loan
        </button>
      </div>

      {showForm && (
        <div className="card-xl border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h4 className="text-base md:text-lg font-normal text-ink">{editingId ? 'Edit Loan' : 'New Loan'}</h4>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="p-1 md:p-2 text-muted hover:text-ink">
              <X className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </div>

          {!editingId && (
            <div className="flex items-center gap-2 mb-6">
              <button type="button" onClick={() => setLoanType('person')}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
                  loanType === 'person' ? "bg-primary text-white shadow-sm" : "bg-surface-soft text-muted hover:bg-surface-strong"
                )}>
                <User className="w-3.5 h-3.5" />
                Person Loan
              </button>
              <button type="button" onClick={() => setLoanType('inter_account')}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
                  loanType === 'inter_account' ? "bg-primary text-white shadow-sm" : "bg-surface-soft text-muted hover:bg-surface-strong"
                )}>
                <Building2 className="w-3.5 h-3.5" />
                Inter-Account
              </button>
            </div>
          )}

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
                  {loanType === 'person' ? 'From Account' : 'Lender Account'}
                </label>
                {editingId ? (
                  <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">{accountOptions.find(o => o.value === form.lender_account_id)?.label || `Account #${form.lender_account_id}`}</div>
                ) : (
                  <Select
                    value={form.lender_account_id}
                    onChange={v => setForm({...form, lender_account_id: v})}
                    placeholder={loanType === 'person' ? 'Select Account' : 'Select Lender'}
                    options={accountOptions}
                  />
                )}
              </div>

              {loanType === 'person' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Name</label>
                  {editingId ? (
                    <input type="text" value={form.borrower_name}
                      onChange={e => setForm({...form, borrower_name: e.target.value})}
                      placeholder="Person name"
                      className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
                  ) : (
                    <input type="text" required value={form.borrower_name}
                      onChange={e => setForm({...form, borrower_name: e.target.value})}
                      placeholder="Enter person name"
                      className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Borrower Account</label>
                  {editingId ? (
                    <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">{accountOptions.find(o => o.value === form.borrower_account_id)?.label || `Account #${form.borrower_account_id}`}</div>
                  ) : (
                    <Select
                      value={form.borrower_account_id}
                      onChange={v => setForm({...form, borrower_account_id: v})}
                      placeholder="Select Borrower"
                      options={accountOptions}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount ({currency})</label>
                {editingId ? (
                  <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm financial-number">{form.amount}</div>
                ) : (
                  <input type="text" inputMode="decimal" required value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Date Given</label>
                {editingId ? (
                  <div className="w-full px-5 py-3.5 bg-surface-soft border border-hairline text-muted rounded-md text-sm">{form.date_given}</div>
                ) : (
                  <DatePicker value={form.date_given} onChange={v => setForm({...form, date_given: v})} />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Due Date</label>
                <DatePicker value={form.due_date} onChange={v => setForm({...form, due_date: v})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Interest Rate (%)</label>
                <input type="number" step="0.01" value={form.interest_rate}
                  onChange={e => setForm({...form, interest_rate: e.target.value})}
                  placeholder="Optional"
                  className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Particulars</label>
                <input type="text" value={form.particulars}
                  onChange={e => setForm({...form, particulars: e.target.value})}
                  placeholder="Loan description"
                  className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="btn-secondary px-8 py-3">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary px-10 py-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {editingId ? 'Update Loan' : 'Create Loan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'settled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-1.5 rounded-pill text-xs font-bold uppercase tracking-wider transition-all",
              statusFilter === s ? "bg-primary text-white shadow-sm" : "bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink"
            )}
          >
            {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Settled'}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
              <th className="px-5 py-3 whitespace-nowrap">Lender</th>
              <th className="px-5 py-3 whitespace-nowrap">Borrower</th>
              <th className="px-5 py-3 whitespace-nowrap text-right">Amount</th>
              <th className="px-5 py-3 whitespace-nowrap">Date Given</th>
              <th className="px-5 py-3 whitespace-nowrap">Due Date</th>
              <th className="px-5 py-3 whitespace-nowrap">Status</th>
              <th className="px-5 py-3 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            <AnimatePresence initial={false}>
            {filteredLoans.map(loan => (
              <motion.tr key={loan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-surface-soft/30 transition-colors">
                <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-ink">{loan.lender_name || `Account #${loan.lender_account_id}`}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-ink">
                  {loan.borrower_name || loan.borrower_account_name || `Account #${loan.borrower_account_id}`}
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">
                  {currency}{loan.amount.toLocaleString()}
                  {loan.borrower_name && loan.remaining != null && loan.remaining < loan.amount && (
                    <div className="text-[10px] font-medium text-muted mt-0.5">Remaining: {currency}{loan.remaining.toLocaleString()}</div>
                  )}
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted">{format(new Date(loan.date_given), 'dd MMM yyyy')}</td>
                <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-muted">{loan.due_date ? format(new Date(loan.due_date), 'dd MMM yyyy') : '-'}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-bold uppercase tracking-wider",
                    loan.status === 'active' ? "bg-semantic-up/10 text-semantic-up" :
                    loan.status === 'settled' ? "bg-muted/10 text-muted" :
                    "bg-semantic-down/10 text-semantic-down"
                  )}>
                    {loan.status === 'settled' && <CheckCircle2 className="w-3 h-3" />}
                    {loan.status}
                  </span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {loan.status === 'active' && (
                      <button onClick={() => handleSettleOpen(loan)} disabled={settlingId === loan.id}
                        className="px-3 py-1.5 rounded-pill text-xs font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                        {settlingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Settle
                      </button>
                    )}
                    <button onClick={() => openEdit(loan)}
                      className="px-3 py-1.5 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(loan.id)} disabled={deletingId === loan.id}
                      className="px-3 py-1.5 rounded-pill text-xs font-bold bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 transition-colors disabled:opacity-50">
                      {deletingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            </AnimatePresence>
            {loading && (
              <tr><td colSpan={7} className="px-5 py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" />
              </td></tr>
            )}
            {!loading && filteredLoans.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-muted italic font-medium">No loans found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <AnimatePresence initial={false}>
        {filteredLoans.map(loan => (
          <motion.div key={loan.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-canvas p-4 rounded-xl border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className={cn(
                  "w-4 h-4",
                  loan.status === 'active' ? "text-semantic-up" : "text-muted"
                )} />
                <span className={cn(
                  "px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
                  loan.status === 'active' ? "bg-semantic-up/10 text-semantic-up" :
                  loan.status === 'settled' ? "bg-muted/10 text-muted" : "bg-semantic-down/10 text-semantic-down"
                )}>{loan.status}</span>
              </div>
              <span className="text-sm font-bold text-ink financial-number">
                {currency}{loan.amount.toLocaleString()}
                {loan.borrower_name && loan.remaining != null && loan.remaining < loan.amount && (
                  <span className="block text-[10px] font-medium text-muted">Rem: {currency}{loan.remaining.toLocaleString()}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-ink">{loan.lender_name || `#${loan.lender_account_id}`}</span>
              <ArrowRight className="w-3 h-3 text-muted" />
              <span className="font-semibold text-ink">{loan.borrower_name || loan.borrower_account_name || `#${loan.borrower_account_id}`}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{format(new Date(loan.date_given), 'dd MMM yyyy')}</span>
              {loan.due_date && <span>Due: {format(new Date(loan.due_date), 'dd MMM yyyy')}</span>}
            </div>
            {loan.particulars && <p className="text-xs text-muted">{loan.particulars}</p>}
            <div className="flex gap-2 pt-1">
              {loan.status === 'active' && (
                <button onClick={() => handleSettleOpen(loan)} disabled={settlingId === loan.id}
                  className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-up/10 text-semantic-up hover:bg-semantic-up/20 transition-colors disabled:opacity-50">
                  {settlingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Mark Settled'}
                </button>
              )}
              <button onClick={() => openEdit(loan)}
                className="py-2 px-3 rounded-pill text-xs font-bold bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink transition-colors flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button onClick={() => handleDelete(loan.id)} disabled={deletingId === loan.id}
                className="flex-1 py-2 rounded-pill text-xs font-bold bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 transition-colors disabled:opacity-50">
                {deletingId === loan.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
        {loading && (
          <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline">
            <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" />
          </div>
        )}
        {!loading && filteredLoans.length === 0 && (
          <div className="p-12 text-center bg-surface-soft rounded-xl border border-dashed border-hairline text-muted font-medium italic">
            No loans found.
          </div>
        )}
      </div>

      {/* Settle modal */}
      {settleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-canvas rounded-xl border border-hairline shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-base font-normal text-ink">Settle Loan</h4>
            <div className="text-sm text-muted space-y-1">
              <p>Borrower: <span className="font-semibold text-ink">{settleModal.borrowerName}</span></p>
              <p>Original: <span className="font-semibold text-ink">{currency}{settleModal.amount.toLocaleString()}</span></p>
              <p>Remaining: <span className="font-semibold text-ink">{currency}{settleModal.remaining.toLocaleString()}</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount to Settle</label>
              <input type="text" inputMode="decimal" value={settleAmount}
                onChange={e => { setSettleAmount(e.target.value); setSettleError(''); }}
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
              {settleError && <p className="text-xs text-semantic-down font-medium">{settleError}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setSettleModal(null); setSettleAmount(''); setSettleError(''); }}
                className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
              <button onClick={handleSettleSubmit} disabled={settlingId !== null}
                className="btn-primary px-6 py-2.5 text-sm">
                {settlingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Settle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
