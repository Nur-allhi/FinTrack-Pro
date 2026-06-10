import React, { useEffect, useRef } from 'react';
import { Users, Wallet, TrendingUp, FileText, Trash2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const items = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'recyclebin', label: 'Recycle Bin', icon: Trash2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MoreMenu({ isOpen, onClose, activeTab, onTabChange }: MoreMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl shadow-2xl bg-canvas border-t border-hairline"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
          >
            <div className="w-10 h-1 bg-hairline rounded-full mx-auto mt-3 mb-4" />
            <div className="grid grid-cols-3 gap-3 px-6 pb-6">
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { onTabChange(id); onClose(); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors min-h-[44px] min-w-[44px] ${
                    activeTab === id ? 'bg-primary/10 text-primary' : 'text-body hover:bg-surface-soft'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
