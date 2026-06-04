import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { Account, Transaction, Loan, Investment, Member, WriteOperation } from '../types';
import { localDb, LocalTransaction, LocalLoan, LocalInvestment, LocalInvestmentReturn } from '../services/localDb';
import { generateId } from '../utils/ids';
import { format } from 'date-fns';
import { useToast } from './Toast';
import {
  TransactionForm, TransactionFormState,
  TransferForm, TransferFormState,
  LoanCreateForm, LoanFormState,
  LoanSettleForm, LoanSettleFormState,
  InvestmentCreateForm, InvestmentFormState,
  InvestmentReturnForm, InvestmentReturnFormState,
} from './WriteModalForms';

type WriteMode = 'transaction' | 'transfer' | 'loan' | 'loan_settle' | 'investment' | 'investment_return';

interface WriteModalProps {
  operation: WriteOperation;
  accounts: Account[];
  members: Member[];
  currency: string;
  onClose: () => void;
  onTransactionSaved?: () => void;
}

function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function successToast(t: string): string { return t; }

function getInitialTransactionState(editTx?: Transaction, prefillAccountId?: number): TransactionFormState {
  if (editTx) {
    return {
      account_id: String(editTx.account_id),
      date: editTx.date,
      particulars: editTx.particulars,
      amount: Math.abs(editTx.amount).toString(),
      isCredit: editTx.amount > 0,
      category: editTx.category || '',
    };
  }
  return {
    account_id: prefillAccountId ? String(prefillAccountId) : '',
    date: today(),
    particulars: '',
    amount: '',
    isCredit: false,
    category: '',
  };
}

function getInitialTransferState(): TransferFormState {
  return { from_account_id: '', to_account_id: '', amount: '', particulars: '', date: today() };
}

function getInitialLoanFormState(editLoan?: Loan): LoanFormState {
  if (editLoan) {
    return {
      loanType: editLoan.borrower_name ? 'person' : 'inter_account',
      lender_account_id: String(editLoan.lender_account_id),
      borrower_account_id: editLoan.borrower_account_id ? String(editLoan.borrower_account_id) : '',
      borrower_name: editLoan.borrower_name || '',
      amount: String(editLoan.amount),
      date_given: editLoan.date_given,
      due_date: editLoan.due_date || '',
      interest_rate: editLoan.interest_rate ? String(editLoan.interest_rate) : '',
      particulars: editLoan.particulars,
    };
  }
  return {
    loanType: 'person',
    lender_account_id: '',
    borrower_account_id: '',
    borrower_name: '',
    amount: '',
    date_given: today(),
    due_date: '',
    interest_rate: '',
    particulars: '',
  };
}

function getInitialSettleState(): LoanSettleFormState {
  return { loanId: '', amount: '', date: today() };
}

function getInitialInvestmentState(): InvestmentFormState {
  return { account_id: '', principal: '', date: today() };
}

function getInitialReturnState(): InvestmentReturnFormState {
  return { investment_id: '', date: today(), amount: '', percentage: '' };
}

function findLocalAccount(accounts: Account[], serverId: number) {
  return accounts.find(a => a.id === serverId);
}

export default function WriteModal({ operation, accounts, members, currency, onClose, onTransactionSaved }: WriteModalProps) {
  const { toast } = useToast();
  const isWriting = useRef(false);
  const [closing, setClosing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loans, setLoans] = useState<{ id: number; label: string; remaining: number; currency: string }[]>([]);
  const [investments, setInvestments] = useState<{ id: number; label: string }[]>([]);

  const isEdit = operation.type === 'loan_edit' || operation.type === 'transaction' && !!operation.editTx;

  const determineMode = useCallback((op: WriteOperation): WriteMode => {
    switch (op.type) {
      case 'transaction': return 'transaction';
      case 'transfer': return 'transfer';
      case 'loan_create':
      case 'loan_edit': return 'loan';
      case 'loan_settle': return 'loan_settle';
      case 'investment_create': return 'investment';
      case 'investment_return': return 'investment_return';
    }
  }, []);

  const [mode, setMode] = useState<WriteMode>(() => determineMode(operation));

  const [txState, setTxState] = useState<TransactionFormState>(() =>
    getInitialTransactionState(operation.type === 'transaction' ? operation.editTx : undefined, operation.type === 'transaction' ? operation.prefillAccountId : undefined));
  const [transferState, setTransferState] = useState<TransferFormState>(getInitialTransferState());
  const [loanState, setLoanState] = useState<LoanFormState>(() =>
    getInitialLoanFormState(operation.type === 'loan_edit' ? operation.loan : undefined));
  const [settleState, setSettleState] = useState<LoanSettleFormState>(() => {
    if (operation.type === 'loan_settle') {
      return { loanId: String(operation.loan.id), amount: String(operation.loan.remaining), date: today() };
    }
    return getInitialSettleState();
  });
  const [invState, setInvState] = useState<InvestmentFormState>(getInitialInvestmentState());
  const [returnState, setReturnState] = useState<InvestmentReturnFormState>(() => {
    if (operation.type === 'investment_return') {
      return { investment_id: String(operation.investment.id), date: today(), amount: '', percentage: '' };
    }
    return getInitialReturnState();
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    localDb.getTransactions().then(txns => {
      setCategories([...new Set(txns.map(t => t.category).filter(Boolean))]);
    }).catch(() => {});
    localDb.getLoans().then(loans => {
      setLoans(loans.map(l => ({
        id: l.server_id ?? 0,
        label: l.borrower_name || `Loan #${l.server_id ?? l.id}`,
        remaining: l.remaining,
        currency,
      })));
    }).catch(() => {});
    localDb.getInvestments().then(invs => {
      setInvestments(invs.map(i => ({
        id: i.server_id ?? 0,
        label: `Investment #${i.server_id ?? i.id} (${currency}${i.principal.toLocaleString()})`,
      })));
    }).catch(() => {});
  }, []);

  const handleClose = () => {
    setBatchMode(false);
    setClosing(true);
    setTimeout(onClose, 200);
  };

  function resetAllForms() {
    setTxState(getInitialTransactionState());
    setTransferState(getInitialTransferState());
    setLoanState(getInitialLoanFormState());
    setSettleState(getInitialSettleState());
    setInvState(getInitialInvestmentState());
    setReturnState(getInitialReturnState());
  }

  // ─── Submit Handlers ─────────────────────────────────────────────────────

  const handleTransactionSubmit = async () => {
    const amount = parseFloat(txState.amount) * (txState.isCredit ? 1 : -1);
    const accountServerId = Number(txState.account_id);
    if (!accountServerId) { toast("Select an account.", 'error'); return false; }

    const localAccounts = await localDb.getAccounts();
    const targetAccount = localAccounts.find(a => a.server_id === accountServerId);
    if (!targetAccount) { toast("Account not found locally.", 'error'); return false; }

    const editingTx = operation.type === 'transaction' ? operation.editTx : undefined;
    const localId = editingTx ? (editingTx.id.toString().includes('-') ? editingTx.id.toString() : generateId()) : generateId();
    const oldAmount = editingTx?.amount || 0;
    const delta = amount - oldAmount;

    const record: LocalTransaction = {
      id: localId,
      server_id: editingTx && typeof editingTx.id === 'number' ? editingTx.id : null,
      account_id: targetAccount.id,
      date: txState.date,
      particulars: txState.particulars,
      category: txState.category || 'Uncategorized',
      amount,
      type: 'normal',
      linked_transaction_id: editingTx?.linked_transaction_id?.toString() || null,
      summary: null,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      _deleted: false,
    };

    await localDb.putTransaction(record);
    if (delta !== 0) {
      await localDb.adjustAccountBalance(targetAccount.id, delta);
    }
    return true;
  };

  const handleTransferSubmit = async () => {
    const amount = parseFloat(transferState.amount);
    const fromServerId = Number(transferState.from_account_id);
    const toServerId = Number(transferState.to_account_id);
    if (!fromServerId || !toServerId) { toast("Select both accounts.", 'error'); return false; }
    if (fromServerId === toServerId) { toast("Source and destination must differ.", 'error'); return false; }

    const localAccounts = await localDb.getAccounts();
    const source = localAccounts.find(a => a.server_id === fromServerId);
    const dest = localAccounts.find(a => a.server_id === toServerId);
    if (!source || !dest) { toast("Account not found locally.", 'error'); return false; }

    const now = new Date().toISOString();
    const creditId = generateId();
    const debitId = generateId();

    const debitTx: LocalTransaction = {
      id: debitId, account_id: source.id, date: transferState.date,
      particulars: transferState.particulars || 'Transfer', category: 'Transfer',
      amount: -amount, type: 'transfer', linked_transaction_id: creditId,
      summary: null, updated_at: now, sync_status: 'pending', _deleted: false,
    };
    const creditTx: LocalTransaction = {
      id: creditId, account_id: dest.id, date: transferState.date,
      particulars: transferState.particulars || 'Transfer', category: 'Transfer',
      amount, type: 'transfer', linked_transaction_id: debitId,
      summary: null, updated_at: now, sync_status: 'pending', _deleted: false,
    };

    await Promise.all([localDb.putTransaction(debitTx), localDb.putTransaction(creditTx)]);
    await Promise.all([
      localDb.adjustAccountBalance(source.id, -amount),
      localDb.adjustAccountBalance(dest.id, amount),
    ]);
    return true;
  };

  const handleLoanCreateSubmit = async () => {
    const amount = parseFloat(loanState.amount);
    const localAccounts = await localDb.getAccounts();
    const lender = localAccounts.find(a => a.server_id === Number(loanState.lender_account_id));
    if (!lender) { toast("Lender account not found.", 'error'); return false; }

    const now = new Date().toISOString();
    const record: LocalLoan = {
      id: generateId(),
      lender_account_id: lender.id,
      borrower_account_id: loanState.loanType === 'inter_account'
        ? (localAccounts.find(a => a.server_id === Number(loanState.borrower_account_id))?.id || null) : null,
      borrower_name: loanState.loanType === 'person' ? (loanState.borrower_name || loanState.particulars) : null,
      amount, remaining: amount,
      date_given: loanState.date_given,
      due_date: loanState.due_date || null,
      interest_rate: loanState.interest_rate ? parseFloat(loanState.interest_rate) : null,
      particulars: loanState.particulars,
      status: 'active', settled_date: null,
      updated_at: now, sync_status: 'pending', _deleted: false,
    };

    await localDb.putLoan(record);

    const lenderTx: LocalTransaction = {
      id: generateId(), account_id: lender.id, date: loanState.date_given,
      particulars: loanState.particulars || 'Loan Given', category: 'Loan Given',
      amount: -amount, type: 'normal', linked_transaction_id: null,
      summary: null, updated_at: now, sync_status: 'pending', _deleted: false,
    };
    await localDb.putTransaction(lenderTx);
    await localDb.adjustAccountBalance(lender.id, -amount);

    if (loanState.loanType === 'inter_account' && loanState.borrower_account_id) {
      const borrower = localAccounts.find(a => a.server_id === Number(loanState.borrower_account_id));
      if (borrower) {
        const borrowerTx: LocalTransaction = {
          id: generateId(), account_id: borrower.id, date: loanState.date_given,
          particulars: loanState.particulars || 'Loan Received', category: 'Loan Received',
          amount: +amount, type: 'normal', linked_transaction_id: null,
          summary: null, updated_at: now, sync_status: 'pending', _deleted: false,
        };
        await localDb.putTransaction(borrowerTx);
        await localDb.adjustAccountBalance(borrower.id, +amount);
      }
    }
    return true;
  };

  const handleLoanEditSubmit = async () => {
    if (operation.type !== 'loan_edit') return false;
    const localLoans = await localDb.getLoans();
    const local = localLoans.find(l => l.server_id === operation.loan.id);
    if (!local) { toast("Loan not found locally.", 'error'); return false; }

    await localDb.putLoan({
      ...local,
      borrower_name: loanState.loanType === 'person' ? (loanState.borrower_name || null) : local.borrower_name,
      due_date: loanState.due_date || null,
      interest_rate: loanState.interest_rate ? parseFloat(loanState.interest_rate) : null,
      particulars: loanState.particulars,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    return true;
  };

  const handleSettleSubmit = async () => {
    const settleAmount = parseFloat(settleState.amount);
    if (!settleAmount || settleAmount <= 0) { toast("Enter a valid amount.", 'error'); return false; }

    const loanId = Number(settleState.loanId);
    const localLoans = await localDb.getLoans();
    const local = localLoans.find(l => l.server_id === loanId);
    if (!local) { toast("Loan not found locally.", 'error'); return false; }
    if (settleAmount > local.remaining) { toast("Amount exceeds remaining balance.", 'error'); return false; }

    const newRemaining = local.remaining - settleAmount;
    const isSettled = newRemaining <= 0;

    const now = new Date().toISOString();
    await localDb.putLoan({
      ...local,
      remaining: Math.max(0, newRemaining),
      status: isSettled ? 'settled' : 'active',
      settled_date: isSettled ? settleState.date : null,
      updated_at: now,
      sync_status: 'pending',
    });

    const localAccounts = await localDb.getAccounts();
    const lender = localAccounts.find(a => a.id === local.lender_account_id);
    if (lender) {
      const repayTx: LocalTransaction = {
        id: generateId(), account_id: lender.id, date: settleState.date,
        particulars: 'Loan Repayment', category: 'Loan Repayment',
        amount: +settleAmount, type: 'normal', linked_transaction_id: null,
        summary: null, updated_at: now, sync_status: 'pending', _deleted: false,
      };
      await localDb.putTransaction(repayTx);
      await localDb.adjustAccountBalance(lender.id, +settleAmount);
    }

    return true;
  };

  const handleInvestmentCreateSubmit = async () => {
    const record = {
      id: generateId(),
      account_id: invState.account_id,
      principal: parseFloat(invState.principal),
      date: invState.date,
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
      _deleted: false,
    };
    await localDb.putInvestment(record);
    return true;
  };

  const handleInvestmentReturnSubmit = async () => {
    const record = {
      id: generateId(),
      investment_id: returnState.investment_id,
      date: returnState.date,
      amount: parseFloat(returnState.amount),
      percentage: parseFloat(returnState.percentage),
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
      _deleted: false,
    };
    await localDb.putInvestmentReturn(record);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWriting.current) return;
    isWriting.current = true;

    try {
      let ok = false;
      switch (mode) {
        case 'transaction': ok = await handleTransactionSubmit(); break;
        case 'transfer': ok = await handleTransferSubmit(); break;
        case 'loan': ok = isEdit ? await handleLoanEditSubmit() : await handleLoanCreateSubmit(); break;
        case 'loan_settle': ok = await handleSettleSubmit(); break;
        case 'investment': ok = await handleInvestmentCreateSubmit(); break;
        case 'investment_return': ok = await handleInvestmentReturnSubmit(); break;
      }

      if (ok) {
        const msg = isEdit ? 'Updated.' : 'Saved.';
        if (batchMode) {
          toast(`${mode} ${msg}`, 'success');
          resetAllForms();
          onTransactionSaved?.();
        } else {
          setSuccess(msg);
          toast(msg, 'success');
          onTransactionSaved?.();
          setTimeout(handleClose, 600);
        }
      }
    } catch (error) {
      console.error('Write failed:', error);
      toast('Failed to save.', 'error');
    } finally {
      isWriting.current = false;
    }
  };

  const modePills: { key: WriteMode; label: string }[] = [
    { key: 'transaction', label: 'Transaction' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'loan', label: 'Loan' },
    { key: 'investment', label: 'Investment' },
  ];

  const isModeLocked = operation.type === 'loan_edit' || operation.type === 'loan_settle' || operation.type === 'investment_return' || (operation.type === 'transaction' && !!operation.editTx);

  let title = 'New Entry';
  if (isEdit && operation.type === 'loan_edit') title = 'Edit Loan';
  else if (operation.type === 'loan_settle') title = 'Settle Loan';
  else if (operation.type === 'investment_return') title = 'Log Yield';
  else if (operation.type === 'transaction' && operation.editTx) title = 'Edit Transaction';

  const renderForm = () => {
    switch (mode) {
      case 'transaction':
        return <TransactionForm state={txState} onChange={setTxState} accounts={accounts} categories={categories} currency={currency} />;
      case 'transfer':
        return <TransferForm state={transferState} onChange={setTransferState} accounts={accounts} currency={currency} />;
      case 'loan':
        return <LoanCreateForm state={loanState} onChange={setLoanState} accounts={accounts} editMode={isEdit} />;
      case 'loan_settle':
        return <LoanSettleForm state={settleState} onChange={setSettleState} loans={loans} currency={currency} loan={operation.type === 'loan_settle' ? operation.loan : undefined} />;
      case 'investment':
        return <InvestmentCreateForm state={invState} onChange={setInvState} accounts={accounts} />;
      case 'investment_return':
        return <InvestmentReturnForm state={returnState} onChange={setReturnState} investments={investments} currency={currency} investment={operation.type === 'investment_return' ? operation.investment : undefined} />;
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-surface-dark/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-canvas w-full max-w-[28rem] md:max-w-[32rem] lg:max-w-[42rem] rounded-xl border border-hairline shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 md:p-10 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
          <h3 className="text-lg sm:text-2xl font-normal text-ink tracking-tight">{title}</h3>
          <div className="flex items-center gap-2">
            {!isModeLocked && (
              <button
                type="button"
                onClick={() => setBatchMode(!batchMode)}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-pill transition-all ${
                  batchMode ? 'bg-primary text-white shadow-sm' : 'bg-surface-strong text-muted hover:bg-hairline'
                }`}
              >
                {batchMode ? '🔁 Batch ON' : '🔄 Batch'}
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted hover:text-ink transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-10 lg:p-12">
          {success ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-semantic-up/10 rounded-full flex items-center justify-center text-semantic-up shadow-lg shadow-semantic-up/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-normal text-ink">{success}</h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode pills */}
              {!isModeLocked && (
                <div className="flex items-center gap-2 flex-wrap">
                  {modePills.map(pill => (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => setMode(pill.key)}
                      className={`px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all ${
                        mode === pill.key
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface-soft text-muted hover:bg-surface-strong'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}

              {renderForm()}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1 h-11">Cancel</button>
                <button type="submit" className="btn-primary flex-[2] h-11 text-sm">
                  {mode === 'transaction' || mode === 'transfer' ? 'Save' :
                   mode === 'loan' ? (isEdit ? 'Update Loan' : 'Create Loan') :
                   mode === 'loan_settle' ? 'Settle' :
                   mode === 'investment' ? 'Save Investment' :
                   'Save Yield'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
