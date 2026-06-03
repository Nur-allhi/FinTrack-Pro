import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Layers, Plus, Handshake, MoreHorizontal, ArrowLeftRight, FilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MoreMenu from './MoreMenu';

interface BottomNavProps {
  activeTab: string;
  selectedAccountId: number | null;
  onTabChange: (tab: string) => void;
  onNewTransaction: () => void;
  onTransfer: () => void;
  visible: boolean;
}

const navTabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'groups', label: 'Groups', icon: Layers },
  { id: 'loans', label: 'Loans', icon: Handshake },
];

export default function BottomNav({ activeTab, selectedAccountId, onTabChange, onNewTransaction, onTransfer, visible }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const isLedger = !!selectedAccountId;

  useEffect(() => {
    if (!plusMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [plusMenuOpen]);

  return (
    <>
      <motion.div
        className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        animate={{ y: visible ? 0 : 120 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-full glass-nav shadow-2xl pointer-events-auto mb-4">
          {/* Position 1: Home */}
          {(() => {
            const tab = navTabs[0];
            const isActive = activeTab === tab.id && !selectedAccountId;
            return (
              <button
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                    : 'text-body hover:bg-white/10'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-full bg-primary/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5 relative z-10" />
              </button>
            );
          })()}

          {/* Position 2: Groups */}
          {(() => {
            const tab = navTabs[1];
            const isActive = activeTab === tab.id && !selectedAccountId;
            return (
              <button
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                    : 'text-body hover:bg-white/10'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-full bg-primary/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5 relative z-10" />
              </button>
            );
          })()}

          {/* Position 3: Plus / FAB */}
          {!isLedger && (
            <div className="relative" ref={plusMenuRef}>
              <motion.button
                layoutId="fab-plus"
                onClick={() => setPlusMenuOpen((p) => !p)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shadow-lg shadow-primary/30"
                aria-label="New transaction or transfer"
                aria-haspopup="menu"
                aria-expanded={plusMenuOpen}
                whileTap={{ scale: 0.97 }}
              >
                <Plus className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {plusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-canvas border border-hairline rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
                    role="menu"
                  >
                    <button
                      onClick={() => { setPlusMenuOpen(false); onNewTransaction(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-body hover:bg-surface-soft transition-colors"
                      role="menuitem"
                    >
                      <FilePlus className="w-4 h-4 text-primary" />
                      New Transaction
                    </button>
                    <div className="h-px bg-hairline" />
                    <button
                      onClick={() => { setPlusMenuOpen(false); onTransfer(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-body hover:bg-surface-soft transition-colors"
                      role="menuitem"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-primary" />
                      Inter-Account Transfer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Position 4: Loans */}
          {(() => {
            const tab = navTabs[2];
            const isActive = activeTab === tab.id && !selectedAccountId;
            return (
              <button
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                    : 'text-body hover:bg-white/10'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-full bg-primary/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5 relative z-10" />
              </button>
            );
          })()}

          {/* Position 5: More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full text-body hover:bg-white/10 transition-all duration-200"
            aria-label="More options"
            aria-haspopup="dialog"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <MoreMenu isOpen={moreOpen} onClose={() => setMoreOpen(false)} activeTab={activeTab} onTabChange={onTabChange} />

      {isLedger && (
        <motion.button
          layoutId="fab-plus"
          onClick={onNewTransaction}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/30 flex items-center justify-center md:hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          aria-label="New transaction"
        >
          <Plus className="w-7 h-7 text-white" />
        </motion.button>
      )}
    </>
  );
}
