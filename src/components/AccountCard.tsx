import { Wallet, Building2, Smartphone, TrendingUp, Target, Home } from 'lucide-react';
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
}

export default function AccountCard({ account, onClick, currency, typeColors }: AccountCardProps) {
  const Icon = typeIcons[account.type] || Wallet;
  const typeColor = typeColors?.[account.type] || '#0052FF';

  return (
    <button
      onClick={onClick}
      className="card-xl group hover:border-primary transition-all text-left flex flex-col gap-2 md:gap-3"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: typeColor }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 md:gap-2">
            <h5 className="text-sm md:text-base font-semibold text-ink truncate">{account.name}</h5>
            <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">{account.type.replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted truncate">{account.member_name || 'General'}</p>
        </div>
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-xl md:text-2xl font-normal text-ink financial-number tracking-tighter">
          {currency}{account.current_balance.toLocaleString()}
        </p>
        <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-wider">SETTLED</span>
      </div>
    </button>
  );
}
