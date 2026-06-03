import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Clock, Ban } from 'lucide-react';
import { localDb } from '../services/localDb';

interface SignupNudgeProps {
  open: boolean;
  onSignUp: () => void;
  onDismiss: () => void;
  onNeverShow: () => void;
}

export default function SignupNudge({ open, onSignUp, onDismiss, onNeverShow }: SignupNudgeProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      onDismiss();
      setClosing(false);
    }, 200);
  };

  const handleNeverShow = async () => {
    await localDb.setMeta('signup_nudge_dismissed', true);
    onNeverShow();
  };

  const handleSignUp = () => {
    onSignUp();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={closing ? { opacity: 0 } : { opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-canvas w-full max-w-[28rem] rounded-xl border border-hairline shadow-2xl"
          >
            <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
              <h3 className="text-lg font-normal text-ink tracking-tight">Back up your data</h3>
              <button onClick={handleDismiss} className="p-1.5 text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                Your data is stored locally in this browser. Sign up to back up your data and access it from any device.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleSignUp}
                  className="btn-primary h-11 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn-secondary h-11 flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Maybe Later
                </button>
                <button
                  onClick={handleNeverShow}
                  className="text-xs text-muted hover:text-ink transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Never Show Again
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
