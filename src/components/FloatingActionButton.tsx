import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeftRight, FileEdit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionButtonProps {
  onNewTransaction: () => void;
  onNewTransfer: () => void;
  isTransactionModalOpen?: boolean;
  isTransferModalOpen?: boolean;
}

export default function FloatingActionButton({ onNewTransaction, onNewTransfer, isTransactionModalOpen, isTransferModalOpen }: FloatingActionButtonProps) {
  const isAnyModalOpen = isTransactionModalOpen || isTransferModalOpen;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const close = () => {
    window.clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const toggle = () => {
    const next = !isOpen;
    window.clearTimeout(timerRef.current);
    if (next) {
      timerRef.current = window.setTimeout(close, 5000);
    }
    setIsOpen(next);
  };

  useEffect(() => {
    if (isAnyModalOpen) close();
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <AnimatePresence>
        {isOpen && !isAnyModalOpen && (
          <div className="flex flex-col items-end gap-3 mb-2 max-w-[calc(100vw-6rem)]">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ willChange: 'transform, opacity' }}
              onClick={() => {
                onNewTransfer();
                close();
              }}
              className="flex items-center gap-3 px-5 py-3 bg-canvas rounded-pill shadow-xl border border-hairline hover:bg-surface-soft transition-all group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink truncate">Inter-Account Transfer</span>
              <div className="p-2 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
              style={{ willChange: 'transform, opacity' }}
              onClick={() => {
                onNewTransaction();
                close();
              }}
              className="flex items-center gap-3 px-5 py-3 bg-canvas rounded-pill shadow-xl border border-hairline hover:bg-surface-soft transition-all group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink truncate">New Transaction</span>
              <div className="p-2 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors shrink-0">
                <FileEdit className="w-4 h-4 text-primary" />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={toggle}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-primary rotate-45' : 'bg-primary hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Plus className="w-7 h-7 text-white" />
        )}
      </button>

    </div>
  );
}
