import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, RefreshCw, CloudOff, Wifi } from 'lucide-react';
import { cn } from '../utils/cn';
import { syncState, SyncProgress } from '../services/syncEngine';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

type SyncToastState = 'hidden' | 'syncing' | 'done';

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

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [syncToastState, setSyncToastState] = useState<SyncToastState>('hidden');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [wasPending, setWasPending] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSyncing = useRef(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setProgress(s.progress);
      setPendingCount(s.pendingCount);

      if (s.state === 'syncing' && !wasSyncing.current) {
        wasSyncing.current = true;
        setWasPending(s.pendingCount);
        setSyncToastState('syncing');
        if (doneTimer.current) {
          clearTimeout(doneTimer.current);
          doneTimer.current = null;
        }
      }

      if (s.state === 'idle' && wasSyncing.current) {
        wasSyncing.current = false;
        const totalSynced = wasPending;
        setSyncedCount(totalSynced);
        setSyncToastState('done');
        doneTimer.current = setTimeout(() => {
          setSyncToastState('hidden');
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

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
        <div className="flex flex-col gap-2 items-center mb-8">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  "pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg border",
                  "bg-white text-gray-900 border-gray-200"
                )}
              >
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                {t.type === 'info' && <Info className="w-4 h-4 shrink-0 text-gray-500" />}
                <p className="text-sm flex-1">{t.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {syncToastState === 'syncing' && (
            <motion.div
              key="syncing"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="w-full bg-semantic-up/10 border-t border-semantic-up/20 overflow-hidden pointer-events-auto"
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

          {syncToastState === 'done' && (
            <motion.div
              key="done"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="w-full bg-semantic-up/10 border-t border-semantic-up/20 overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-semantic-up">
                <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span>Synced {syncedCount} change{syncedCount !== 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {syncToastState === 'hidden' && !isOnline && (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-semantic-down/10 text-semantic-down border-t border-semantic-down/10 pointer-events-auto">
            <CloudOff className="w-3 h-3 shrink-0" />
            <span>Offline — showing cached data</span>
            {pendingCount > 0 && <span>({pendingCount} pending)</span>}
          </div>
        )}

        {syncToastState === 'hidden' && isOnline && pendingCount > 0 && (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-semantic-up/10 text-semantic-up border-t border-semantic-up/10 pointer-events-auto">
            <Wifi className="w-3 h-3 shrink-0" />
            <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''} to sync</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
