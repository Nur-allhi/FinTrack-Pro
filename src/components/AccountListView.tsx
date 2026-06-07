import React from 'react';
import { Account } from '../types';
import { Edit2, Archive, Wallet, Building2, Smartphone, TrendingUp, Target, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Wallet, bank: Building2, mobile: Smartphone,
  investment: TrendingUp, purpose: Target, home_exp: Home,
};

interface AccountListViewProps {
  accounts: Account[];
  currency: string;
  typeColors?: Record<string, string>;
  onEdit: (acc: Account) => void;
  onToggleArchive: (id: number, current: number) => void;
}

export default function AccountListView({ accounts, currency, typeColors, onEdit, onToggleArchive }: AccountListViewProps) {
  return (
    <>
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
              <th className="px-3 py-2.5 whitespace-nowrap">Account</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Type</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Member</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Group</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-right">Balance</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {accounts.map(acc => {
              const Icon = typeIcons[acc.type] || Wallet;
              return (
                <tr key={acc.id} className="hover:bg-surface-soft/30 transition-colors group">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                      <span className="text-base font-semibold text-ink">{acc.name}</span>
                      {acc.archived && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-pill">Archived</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="text-xs font-medium text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-muted">{acc.member_name || '-'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-primary">{acc.parent_name || '-'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-bold text-ink financial-number">{currency}{acc.current_balance.toLocaleString()}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(acc)} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onToggleArchive(acc.id, acc.archived)} className="p-1.5 text-muted hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors" title={acc.archived ? "Activate" : "Archive"}><Archive className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {accounts.map(acc => {
          const Icon = typeIcons[acc.type] || Wallet;
          return (
            <div key={acc.id} className="bg-canvas p-3 rounded-xl border border-hairline flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: acc.color + '15', color: acc.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-ink truncate">{acc.name}</span>
                  <span className="text-sm font-bold text-ink financial-number shrink-0">{currency}{acc.current_balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">{acc.type.replace('_', ' ')}</span>
                  <span className="text-muted/40">·</span>
                  <span className="text-xs font-medium text-muted">{acc.member_name || 'General'}</span>
                  {acc.parent_name && (
                    <>
                      <span className="text-muted/40">·</span>
                      <span className="text-xs font-medium text-primary">{acc.parent_name}</span>
                    </>
                  )}
                  {acc.archived && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-pill">A</span>}
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => onEdit(acc)} className="text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider">Edit</button>
                  <button onClick={() => onToggleArchive(acc.id, acc.archived)} className="text-[10px] font-bold text-muted hover:text-amber-600 uppercase tracking-wider">{acc.archived ? 'Activate' : 'Archive'}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
