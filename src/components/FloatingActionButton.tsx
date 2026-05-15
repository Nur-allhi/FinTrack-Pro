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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [isTransactionModalOpen, isTransferModalOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => {
                onNewTransfer();
                setIsOpen(false);
              }}
              className="flex items-center gap-4 px-6 py-3.5 bg-canvas rounded-pill shadow-xl border border-hairline hover:bg-surface-soft transition-all group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-ink">Inter-Account Transfer</span>
              <div className="p-2.5 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              onClick={() => {
                onNewTransaction();
                setIsOpen(false);
              }}
              className="flex items-center gap-4 px-6 py-3.5 bg-canvas rounded-pill shadow-xl border border-hairline hover:bg-surface-soft transition-all group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-ink">New Transaction</span>
              <div className="p-2.5 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-primary rotate-45' : 'bg-primary hover:scale-110 active:scale-95'
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
