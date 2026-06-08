import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open === prevOpenRef.current) return;
    prevOpenRef.current = open;
    if (open) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setClosing(true);
      document.body.style.overflow = '';
      const timer = setTimeout(() => { setClosing(false); setVisible(false); }, 350);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 350);
  }, [onClose]);

  if (!visible) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-surface-dark/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-canvas w-full max-w-[28rem] md:max-w-[32rem] lg:max-w-[36rem] rounded-xl border border-hairline shadow-2xl"
      >
        <div className="p-4 sm:p-6 md:p-8 border-b border-hairline flex items-center justify-between bg-surface-soft/30 rounded-t-xl">
          <h3 className="text-lg sm:text-2xl font-normal text-ink tracking-tight">{title}</h3>
          <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted hover:text-ink transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
