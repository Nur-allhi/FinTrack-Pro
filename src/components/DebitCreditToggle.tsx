import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface DebitCreditToggleProps {
  isCredit: boolean;
  onChange: (isCredit: boolean) => void;
}

export default function DebitCreditToggle({ isCredit, onChange }: DebitCreditToggleProps) {
  return (
    <div className="inline-flex bg-surface-soft p-1 rounded-full border border-hairline w-full relative">
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-canvas shadow-sm"
        animate={{ left: isCredit ? '50%' : '4px', right: isCredit ? '4px' : '50%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 text-center py-2.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10",
          !isCredit ? "text-semantic-down" : "text-muted hover:text-ink"
        )}
      >
        Debit
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 text-center py-2.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10",
          isCredit ? "text-semantic-up" : "text-muted hover:text-ink"
        )}
      >
        Credit
      </button>
    </div>
  );
}
