import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  lastSyncAt?: number | null;
}

export default function OfflineIndicator({ isOnline, isSyncing = false, pendingCount = 0, lastSyncAt }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  if (isSyncing) {
    return (
      <div className="flex flex-col items-stretch bg-semantic-up/10">
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-semantic-up">
          <RefreshCw className="w-3 h-3 shrink-0 animate-spin" />
          <span>Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}...</span>
        </div>
        <div className="h-1 bg-semantic-up/20">
          <div className="h-full bg-semantic-up animate-pulse rounded-full transition-all" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

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
