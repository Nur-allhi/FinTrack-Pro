import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
  lastSyncAt?: number | null;
}

export default function OfflineIndicator({ isOnline, pendingCount = 0, lastSyncAt }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0) return null;

  if (isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-semantic-up/10 text-semantic-up">
        <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''} to sync</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-semantic-down/10 text-semantic-down">
      <WifiOff className="w-3 h-3 shrink-0" />
      <span>Offline — showing cached data</span>
      {pendingCount > 0 && (
        <span className="ml-1">({pendingCount} pending)</span>
      )}
    </div>
  );
}
