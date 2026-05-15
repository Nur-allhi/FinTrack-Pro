import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Download, 
  Loader2,
  Plus
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { cacheService } from '../services/cacheService';
import { useToast } from './Toast';
import Select from './Select';

// Sub-components
import TransactionForm from './TransactionForm';
import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
  lastUpdate?: number;
  currency: string;
}

const exportPDF = (txs: (Transaction & { runningBalance: number })[], accountName: string, currency: string, initialBalance: number = 0) => {
  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  const colDate = 24;
  const colParticulars = usableW - colDate - 34 - 34 - 34;
  const colAmt = 34;
  const colWidths = [colDate, colParticulars, colAmt, colAmt, colAmt];
  const headers = ['Date', 'Particulars', 'Debit', 'Credit', 'Balance'];

  const loc = 'en-US';
  const pdfCur = /^[\x00-\x7F]+$/.test(currency) ? currency : 'Tk ';
  const fmtNum = (n: number) => `${pdfCur}${Math.abs(n).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const txsAsc = [...txs].reverse();
  const totalDebit = txsAsc.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = txsAsc.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const closingBal = txsAsc.length > 0 ? txsAsc[txsAsc.length - 1].runningBalance : initialBalance;

  let pageNum = 1;

  const drawPageHeader = () => {
    doc.setFillColor(248, 248, 250);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setDrawColor(0, 82, 255);
    doc.setLineWidth(0.8);
    doc.line(0, 38, pageW, 38);
    doc.setLineWidth(0.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 82, 255);
    doc.text('FinTrack Pro', margin, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Account Statement', pageW / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pageW - margin, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Account: ${accountName}`, margin, 30);
  };

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(0, 82, 255);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.rect(margin, yPos, usableW, 7, 'F');
    let x = margin;
    headers.forEach((h, i) => {
      if (i <= 1) doc.text(h, x + 3, yPos + 5, { align: 'left' });
      else doc.text(h, x + colWidths[i] - 3, yPos + 5, { align: 'right' });
      x += colWidths[i];
    });
    return yPos + 9;
  };

  const drawSummary = (yPos: number, isLastPage: boolean) => {
    const sY = yPos + 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, sY, margin + usableW, sY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);

    const partsX = margin + colDate;
    doc.text('Total:', partsX + 2, sY + 6);

    const debitX = margin + colDate + colParticulars + colAmt;
    if (totalDebit > 0) doc.text(fmtNum(totalDebit), debitX - 2, sY + 6, { align: 'right' });

    const creditX = debitX + colAmt;
    if (totalCredit > 0) doc.text(fmtNum(totalCredit), creditX - 2, sY + 6, { align: 'right' });

    if (isLastPage) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, sY + 10, margin + usableW, sY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text('Closing Balance', partsX + 2, sY + 18);
      doc.text(fmtNum(closingBal), margin + usableW - 2, sY + 18, { align: 'right' });
      return sY + 24;
    }
    return sY + 10;
  };

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${pageNum}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  };

  drawPageHeader();

  const openingY = 46;
  doc.setFillColor(240, 245, 255);
  doc.rect(margin, openingY, usableW, 11, 'F');
  doc.setDrawColor(200, 215, 240);
  doc.rect(margin, openingY, usableW, 11, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Opening Balance', margin + 4, openingY + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(fmtNum(initialBalance), margin + usableW - 4, openingY + 7.5, { align: 'right' });

  let y = openingY + 14;
  y = drawTableHeader(y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  txsAsc.forEach((t, idx) => {
    if (y + 6 > doc.internal.pageSize.getHeight() - 24) {
      drawSummary(y, false);
      drawFooter();
      doc.addPage();
      pageNum++;
      drawPageHeader();
      y = 44;
      y = drawTableHeader(y);
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, usableW, 6, 'F');
    }

    const partic = t.particulars.length > 32 ? t.particulars.slice(0, 30) + '...' : t.particulars;
    let x = margin;
    const vals = [t.date, partic, t.amount < 0 ? fmtNum(t.amount) : '', t.amount > 0 ? fmtNum(t.amount) : '', fmtNum(t.runningBalance)];
    const aligns = ['left', 'left', 'right', 'right', 'right'];

    vals.forEach((v, i) => {
      const px = aligns[i] === 'right' ? x + colWidths[i] - 2 : x + 2;
      doc.text(v, px, y + 4, { align: aligns[i] as 'left' | 'right' });
      x += colWidths[i];
    });
    y += 6;
  });

  y = drawSummary(y, true);
  drawFooter();
  doc.save(`${accountName.replace(/\s+/g, '_')}_statement.pdf`);
};

export default function Ledger({ account, onBack, onUpdate, lastUpdate, currency }: LedgerProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTx, setNewTx] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) return setLoading(false);
    if (showLoading) setLoading(true);
    else setIsSyncing(true);
    
    try {
      const res = await fetch(`/api/transactions/${account.id}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setTransactions(data);
      cacheService.setTransactions(account.id.toString(), data);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!account?.id) return;
      if (transactions.length > 0) return fetchTransactions(false);
      const cached = await cacheService.getTransactions(account.id.toString());
      if (cached) { setTransactions(cached); setLoading(false); fetchTransactions(false); }
      else fetchTransactions(true);
    };
    load();
    setCategoryFilter(null);
    fetch('/api/transactions/categories')
      .then(res => res.json())
      .then(setAllCategories)
      .catch(() => {});
  }, [account.id, lastUpdate]);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    let category = newTx.category;
    let summary = editingTx?.summary || null;

    const optimisticTx: Transaction = {
      id: editingTx ? editingTx.id : Date.now(),
      account_id: account.id,
      date: newTx.date,
      particulars: newTx.particulars,
      category: category || 'Uncategorized',
      amount: amount,
      type: editingTx?.type || 'normal',
      summary: summary,
      linked_transaction_id: editingTx?.linked_transaction_id || null
    };

    const prev = [...transactions];
    if (editingTx) setTransactions(transactions.map(t => t.id === editingTx.id ? optimisticTx : t));
    else setTransactions([optimisticTx, ...transactions]);

    setIsAdding(false);
    setEditingTx(null);
    setNewTx({ date: format(new Date(), 'yyyy-MM-dd'), particulars: '', amount: '', isCredit: false, category: '' });

    try {
      const method = editingTx ? 'PATCH' : 'POST';
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount, summary })
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setTransactions(p => p.map(t => t.id === optimisticTx.id ? { ...t, id: saved.id } : t));
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to save transaction.", 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const prev = [...transactions];
    setTransactions(transactions.filter(t => t.id !== id));
    setDeletingId(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to delete transaction.", 'error');
    }
  };

  const txsWithBalance = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id)
    .reduce((acc, tx) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.initial_balance);
      acc.push({ ...tx, runningBalance: prevBal + Number(tx.amount) });
      return acc;
    }, [] as any[])
    .reverse();

  const categoryCounts = transactions.reduce<Record<string, number>>((acc, tx) => {
    const cat = tx.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const availableCategories = Object.keys(categoryCounts).sort((a, b) =>
    categoryCounts[b] - categoryCounts[a]
  );

  const filteredTxs = categoryFilter
    ? txsWithBalance.filter(tx => (tx.category || 'Uncategorized') === categoryFilter)
    : txsWithBalance;

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 md:gap-3 text-muted hover:text-ink transition-colors font-semibold text-[10px] md:text-sm">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to Portfolio
        </button>
        <button onClick={() => exportPDF(filteredTxs, account.name, currency, account.initial_balance)} className="p-2 md:p-3 text-muted hover:text-ink hover:bg-surface-soft rounded-full border border-hairline transition-all">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="bg-canvas rounded-xl border border-hairline shadow-sm overflow-hidden" aria-label="Transaction Ledger">
        <div className="p-4 md:p-5 flex items-center justify-between bg-primary/5 border-b border-hairline">
          <div>
            <h3 className="text-base md:text-xl font-normal text-ink tracking-tight">{account.name}</h3>
            <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{account.type.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
              {isSyncing && <Loader2 className="w-2.5 md:w-3 h-2.5 md:h-3 animate-spin text-primary" />}
              <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Balance</p>
            </div>
            <p className="text-xl md:text-3xl font-normal text-ink financial-number tracking-tighter">
              {currency}{account.current_balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-hairline bg-canvas flex justify-between items-center">
          <h4 className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Ledger Entries</h4>
          <button onClick={() => setIsAdding(true)} className="btn-primary text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
            <Plus className="w-3 md:w-3.5 h-3 md:h-3.5" />
            Post
          </button>
        </div>

        {availableCategories.length > 0 && (
          <div className="px-4 md:px-5 py-2 border-b border-hairline bg-surface-soft/30">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] shrink-0">Category</span>
              <Select
                value={categoryFilter || ''}
                onChange={v => setCategoryFilter(v || null)}
                placeholder="All Categories"
                options={[
                  { value: '', label: `All (${txsWithBalance.length})` },
                  ...availableCategories.map(cat => ({
                    value: cat,
                    label: `${cat} (${categoryCounts[cat]})`
                  }))
                ]}
                className="min-w-[180px]"
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-4 md:p-5 bg-surface-soft/50 border-b border-hairline">
                <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} availableCategories={allCategories} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em] border-b border-hairline">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredTxs.map((tx, idx) => (
                  <TransactionRow 
                    key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                    isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-hairline">
          <AnimatePresence initial={false}>
            {filteredTxs.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
        {filteredTxs.length === 0 && (
          <div className="px-6 md:px-12 py-16 md:py-32 text-center bg-canvas">
            <div className="w-12 md:w-20 h-12 md:h-20 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 border border-hairline">
              <Plus className="w-6 md:w-10 h-6 md:h-10 text-muted" />
            </div>
            <p className="text-base md:text-xl font-normal text-ink mb-1 md:mb-2">
              {categoryFilter ? 'No matching records' : 'No records found'}
            </p>
            <p className="text-xs md:text-sm text-muted mb-4 md:mb-8">
              {categoryFilter ? 'Try a different category filter.' : 'Post your first ledger entry.'}
            </p>
            <button onClick={() => setIsAdding(true)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3 mx-auto">Add Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
