import { cn } from '../utils/cn';

interface DebitCreditToggleProps {
  isCredit: boolean;
  onChange: (isCredit: boolean) => void;
}

export default function DebitCreditToggle({ isCredit, onChange }: DebitCreditToggleProps) {
  return (
    <div className="flex p-1 bg-surface-strong rounded-pill">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 py-1.5 rounded-pill text-[10px] font-bold transition-all",
          !isCredit ? "bg-canvas text-semantic-down shadow-sm" : "text-muted"
        )}
      >
        DEBIT
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 py-1.5 rounded-pill text-[10px] font-bold transition-all",
          isCredit ? "bg-canvas text-semantic-up shadow-sm" : "text-muted"
        )}
      >
        CREDIT
      </button>
    </div>
  );
}
