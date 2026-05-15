import { cn } from '../utils/cn';

interface DebitCreditToggleProps {
  isCredit: boolean;
  onChange: (isCredit: boolean) => void;
}

export default function DebitCreditToggle({ isCredit, onChange }: DebitCreditToggleProps) {
  return (
    <div className="inline-flex bg-surface-soft p-1 rounded-full border border-hairline w-full">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 text-center py-2.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
          !isCredit ? "bg-canvas text-semantic-down shadow-sm" : "text-muted hover:text-ink"
        )}
      >
        Debit
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 text-center py-2.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
          isCredit ? "bg-canvas text-primary shadow-sm" : "text-muted hover:text-ink"
        )}
      >
        Credit
      </button>
    </div>
  );
}
