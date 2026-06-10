import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Wallet, Building2, Smartphone, TrendingUp, Target, Home, User, Folder, type LucideIcon } from 'lucide-react';
import { Account } from '../types';

const typeIcons: Record<string, LucideIcon> = {
  cash: Wallet,
  bank: Building2,
  mobile: Smartphone,
  investment: TrendingUp,
  purpose: Target,
  home_exp: Home,
};

interface AccountCardProps {
  account: Account;
  onClick: () => void;
  currency: string;
  typeColors?: Record<string, string>;
  filterMemberId?: number | 'all' | 'general';
}

export default memo(function AccountCard({ account, onClick, currency, typeColors, filterMemberId }: AccountCardProps) {
  const Icon = typeIcons[account.type] || Wallet;
  const typeColor = typeColors?.[account.type] || '#A78BFA';
  const showMember = filterMemberId === 'all' && !!account.member_name;
  const hasParent = !!account.parent_name;

  return (
    <motion.button
      layout
      onClick={onClick}
      className="card-xl group hover:border-primary transition-all text-left flex flex-col gap-2 md:gap-3 overflow-hidden"
    >
      <div className="flex items-start gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: typeColor }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-base md:text-lg font-semibold text-ink truncate">{account.name}</h5>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</span>
            {showMember && (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted">
                <User className="w-3 h-3 shrink-0" />
                {account.member_name}
              </span>
            )}
            {hasParent && (
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted">
                <Folder className="w-3 h-3 shrink-0" />
                {account.parent_name}
              </span>
            )}
          </div>
        </div>
        <p className="text-xl md:text-2xl font-normal text-ink financial-number tracking-tighter self-start shrink-0">
          {currency}{account.current_balance.toLocaleString()}
        </p>
      </div>
    </motion.button>
  );
});
