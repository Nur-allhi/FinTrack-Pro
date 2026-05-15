import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface RenameModalProps {
  open: boolean;
  title: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ open, title, initialValue, onConfirm, onCancel }: RenameModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && value.trim() !== initialValue) onConfirm(value.trim());
    else onCancel();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="bg-canvas rounded-xl border border-hairline shadow-2xl w-[320px] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">{title}</h3>
              <button type="button" onClick={onCancel} className="p-1 text-muted hover:text-ink rounded-full hover:bg-surface-soft transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full px-4 py-3 bg-surface-soft border border-hairline rounded-xl text-sm text-ink placeholder:text-muted outline-none focus:border-primary transition-colors"
                placeholder="Category name"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-surface-strong text-ink font-bold text-xs hover:bg-hairline transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-active transition-colors">
                  Rename
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
