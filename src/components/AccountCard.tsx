import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Building2, Smartphone, TrendingUp, Target, Home, Folder } from 'lucide-react';
import { Account } from '../types';

const typeIcons: Record<string, any> = {
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

export default function AccountCard({ account, onClick, currency, typeColors, filterMemberId }: AccountCardProps) {
  const Icon = typeIcons[account.type] || Wallet;
  const typeColor = typeColors?.[account.type] || '#0052FF';
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
          <AnimatePresence mode="popLayout">
            {showMember && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-muted truncate"
              >
                {account.member_name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider">{account.type.replace('_', ' ')}</span>
          {hasParent && <span className="flex items-center gap-1 text-xs md:text-sm text-muted truncate max-w-28"><Folder className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />{account.parent_name}</span>}
        </div>
      </div>
      <p className="text-xl md:text-2xl font-normal text-ink financial-number tracking-tighter">
        {currency}{account.current_balance.toLocaleString()}
      </p>
    </motion.button>
  );
}
