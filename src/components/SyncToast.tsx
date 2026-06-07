import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, CloudOff, Wifi } from 'lucide-react';
import { syncState, SyncProgress } from '../services/syncEngine';

interface SyncToastProps {
  isOnline: boolean;
  pendingCount: number;
}

type ToastState = 'hidden' | 'syncing' | 'done';

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

export default function SyncToast({ isOnline, pendingCount }: SyncToastProps) {
  const [toastState, setToastState] = useState<ToastState>('hidden');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [wasPending, setWasPending] = useState(0);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSyncing = useRef(false);

  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setProgress(s.progress);

      if (s.state === 'syncing' && !wasSyncing.current) {
        wasSyncing.current = true;
        setWasPending(s.pendingCount);
        setToastState('syncing');
        if (doneTimer.current) {
          clearTimeout(doneTimer.current);
          doneTimer.current = null;
        }
      }

      if (s.state === 'idle' && wasSyncing.current) {
        wasSyncing.current = false;
        const totalSynced = wasPending;
        setSyncedCount(totalSynced);
        setToastState('done');
        doneTimer.current = setTimeout(() => {
          setToastState('hidden');
        }, 2500);
      }
    });
    return unsub;
  }, [wasPending]);

  useEffect(() => {
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, []);

  return (
    <div className="overflow-hidden">
      <AnimatePresence>
        {toastState === 'syncing' && (
          <motion.div
            key="syncing"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="bg-semantic-up/10 border-b border-semantic-up/20 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-semantic-up">
              <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 animate-spin" />
              <span>
                {progress
                  ? `Syncing... (${progress.current}/${progress.total})`
                  : `Syncing ${pendingCount} pending...`
                }
              </span>
            </div>
            <div className="h-1 bg-semantic-up/20">
              <div
                className="h-full bg-semantic-up rounded-full transition-all duration-500"
                style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : '30%' }}
              />
            </div>
          </motion.div>
        )}

        {toastState === 'done' && (
          <motion.div
            key="done"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="bg-semantic-up/10 border-b border-semantic-up/20 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-semantic-up">
              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span>Synced {syncedCount} change{syncedCount !== 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toastState === 'hidden' && !isOnline && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-semantic-down/10 text-semantic-down border-b border-semantic-down/10">
          <CloudOff className="w-3 h-3 shrink-0" />
          <span>Offline — showing cached data</span>
          {pendingCount > 0 && <span>({pendingCount} pending)</span>}
        </div>
      )}

      {toastState === 'hidden' && isOnline && pendingCount > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-semantic-up/10 text-semantic-up border-b border-semantic-up/10">
          <Wifi className="w-3 h-3 shrink-0" />
          <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''} to sync</span>
        </div>
      )}
    </div>
  );
}
