import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { cn } from '../utils/cn';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  lastSyncAt?: number | null;
}

function formatLastSync(ts: number | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) {
    const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Just now (${time})`;
  }
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function StatusDot({ color }: { color: 'green' | 'amber' | 'gray' }) {
  return (
    <span
      className={cn(
        'inline-block w-1.5 h-1.5 rounded-full shrink-0',
        color === 'green' && 'bg-semantic-up',
        color === 'amber' && 'bg-yellow-500',
        color === 'gray' && 'bg-muted/40'
      )}
    />
  );
}

export default function OfflineIndicator({ isOnline, isSyncing = false, pendingCount = 0, lastSyncAt }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return lastSyncAt ? (
      <div className="flex items-center justify-center gap-2 px-4 py-1 text-[10px] font-medium text-muted/60">
        <StatusDot color="green" />
        <Cloud className="w-3 h-3 shrink-0" />
        <span>Last synced {formatLastSync(lastSyncAt)}</span>
      </div>
    ) : null;
  }

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
        <StatusDot color="amber" />
        <Wifi className="w-3 h-3 shrink-0" />
        <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''} to sync</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-semantic-down/10 text-semantic-down">
      <StatusDot color="gray" />
      <CloudOff className="w-3 h-3 shrink-0" />
      <span>Offline — showing cached data</span>
      {pendingCount > 0 && (
        <span className="ml-1">({pendingCount} pending)</span>
      )}
    </div>
  );
}
