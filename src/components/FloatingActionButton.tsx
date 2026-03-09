import React, { useState } from 'react';
import { Plus, ArrowLeftRight, FileEdit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionButtonProps {
  onNewTransaction: () => void;
  onNewTransfer: () => void;
}

export default function FloatingActionButton({ onNewTransaction, onNewTransfer }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
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
              className="flex items-center gap-3 px-4 py-3 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all group"
            >
              <span className="text-sm font-bold">Inter-Account Transfer</span>
              <div className="p-2 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
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
              className="flex items-center gap-3 px-4 py-3 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all group"
            >
              <span className="text-sm font-bold">New Transaction</span>
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-800 rotate-45' : 'bg-primary hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white -rotate-45" />
        ) : (
          <Plus className="w-8 h-8 text-white" />
        )}
      </button>

      {/* Backdrop for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10 bg-slate-900/10 backdrop-blur-[1px]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
