import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export default function OfflineIndicator({ isOnline }: OfflineIndicatorProps) {
  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-semantic-down/10 text-semantic-down">
      <WifiOff className="w-3 h-3 shrink-0" />
      <span>Offline — showing cached data</span>
    </div>
  );
}
