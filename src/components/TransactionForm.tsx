import React from 'react';
import DebitCreditToggle from './DebitCreditToggle';

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent) => void;
  newTx: any;
  setNewTx: (tx: any) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  onSubmit,
  newTx,
  setNewTx,
  onCancel
}: TransactionFormProps) {
  return (
    <div className="p-12 bg-surface-soft/30 rounded-xl border border-hairline">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="tx-date" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
          <input 
            id="tx-date"
            type="date" 
            required
            value={newTx.date}
            onChange={e => setNewTx({...newTx, date: e.target.value})}
            className="px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label htmlFor="tx-particulars" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Transaction Description</label>
          <input 
            id="tx-particulars"
            type="text" 
            placeholder="Institutional memo"
            required
            value={newTx.particulars}
            onChange={e => setNewTx({...newTx, particulars: e.target.value})}
            className="px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tx-amount" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Settlement Amount</label>
          <div className="flex flex-col gap-3">
            <input 
              id="tx-amount"
              type="number" 
              placeholder="0.00"
              required
              value={newTx.amount}
              onChange={e => setNewTx({...newTx, amount: e.target.value})}
              className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number"
            />
            <DebitCreditToggle isCredit={newTx.isCredit} onChange={v => setNewTx({...newTx, isCredit: v})} />
          </div>
        </div>
        <div className="flex gap-3 items-end pb-1">
          <button 
            type="submit" 
            className="btn-primary flex-1 h-[48px]"
          >
            Post
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-secondary h-[48px] px-8"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
