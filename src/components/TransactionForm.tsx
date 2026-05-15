import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import DebitCreditToggle from './DebitCreditToggle';
import Select from './Select';

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent) => void;
  newTx: any;
  setNewTx: (tx: any) => void;
  onCancel: () => void;
  availableCategories?: string[];
}

export default function TransactionForm({
  onSubmit,
  newTx,
  setNewTx,
  onCancel,
  availableCategories = []
}: TransactionFormProps) {
  const catInList = availableCategories.includes(newTx.category);
  const [isCustom, setIsCustom] = useState(!catInList && newTx.category !== '');

  useEffect(() => {
    if (newTx.category && catInList) setIsCustom(false);
  }, [newTx.category, availableCategories]);

  const handleCategorySelect = (value: string) => {
    if (value === '__new__') {
      setIsCustom(true);
      setNewTx({...newTx, category: ''});
    } else {
      setIsCustom(false);
      setNewTx({...newTx, category: value});
    }
  };

  return (
    <div className="bg-canvas border border-hairline rounded-xl shadow-sm p-6 md:p-8">
      <form onSubmit={onSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2" htmlFor="tx-date">
              Value Date
            </label>
            <div className="relative">
              <input
                id="tx-date"
                type="date"
                required
                value={newTx.date}
                onChange={e => setNewTx({...newTx, date: e.target.value})}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-full flex items-center justify-between gap-2 px-3.5 py-3 bg-surface-soft border border-hairline rounded-pill text-xs font-semibold uppercase tracking-wider text-ink hover:bg-canvas hover:border-muted transition-all pointer-events-none">
                <span>{newTx.date ? new Date(newTx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}</span>
                <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
              </div>
            </div>
          </div>
          <div className="md:col-span-7">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2" htmlFor="tx-particulars">
              Transaction Description
            </label>
            <input
              id="tx-particulars"
              type="text"
              placeholder="Institutional memo"
              required
              value={newTx.particulars}
              onChange={e => setNewTx({...newTx, particulars: e.target.value})}
              className="w-full border border-hairline rounded-xl py-3 px-4 text-ink focus:ring-primary focus:border-primary transition-all outline-none text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 text-left md:text-right" htmlFor="tx-amount">
              Settlement Amount
            </label>
            <input
              id="tx-amount"
              type="number"
              placeholder="0.00"
              required
              value={newTx.amount}
              onChange={e => setNewTx({...newTx, amount: e.target.value})}
              className="w-full border border-hairline rounded-xl py-3 px-4 text-ink text-left md:text-right focus:ring-primary focus:border-primary transition-all outline-none text-sm financial-number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2" htmlFor="tx-category">
              Category
            </label>
            <Select
              value={isCustom ? '__new__' : (catInList ? newTx.category : '')}
              onChange={handleCategorySelect}
              placeholder={newTx.category && !catInList ? newTx.category : 'Select category'}
              options={[
                ...availableCategories.map(c => ({ value: c, label: c })),
                { value: '__new__', label: 'New category...' }
              ]}
            />
            {isCustom && (
              <input
                type="text"
                placeholder="Type new category name"
                value={newTx.category}
                onChange={e => setNewTx({...newTx, category: e.target.value})}
                className="w-full mt-2 border border-hairline rounded-xl py-3 px-4 text-ink focus:ring-primary focus:border-primary transition-all outline-none text-sm"
              />
            )}
          </div>
          <div className="hidden md:block md:col-span-4">
            <DebitCreditToggle isCredit={newTx.isCredit} onChange={v => setNewTx({...newTx, isCredit: v})} />
          </div>
          <div className="hidden md:flex md:col-span-3 justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-10 py-4 rounded-full bg-surface-strong text-ink font-bold text-sm hover:bg-hairline transition-colors min-w-[120px]">
              Cancel
            </button>
            <button type="submit" className="px-10 py-4 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-active transition-colors shadow-lg min-w-[120px]">
              Post
            </button>
          </div>
        </div>

        <div className="md:hidden space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-3 text-center">
              Transaction Type
            </label>
            <div className="flex justify-center">
              <DebitCreditToggle isCredit={newTx.isCredit} onChange={v => setNewTx({...newTx, isCredit: v})} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-full bg-surface-strong text-ink font-bold text-sm hover:bg-hairline transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-4 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-active transition-colors shadow-lg">
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
