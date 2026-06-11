import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import { syncState } from '../services/syncEngine';

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

let nextId = 0;
let syncingToastId: number | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const wasSyncing = useRef(false);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutsRef.current.delete(id);
    }, 4000);
    timeoutsRef.current.set(id, timeoutId);
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current.values()) {
        clearTimeout(timeoutId);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      if (s.state === 'syncing' && !wasSyncing.current) {
        wasSyncing.current = true;
        syncingToastId = addToast('Syncing...', 'info');
      }

      if (s.state === 'idle' && wasSyncing.current) {
        wasSyncing.current = false;
        if (syncingToastId != null) {
          removeToast(syncingToastId);
          syncingToastId = null;
        }
        addToast('Synced', 'success');
      }
    });
    return unsub;
  }, [addToast, removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
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
              {t.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 text-gray-500" />}
              <p className="text-sm flex-1">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
