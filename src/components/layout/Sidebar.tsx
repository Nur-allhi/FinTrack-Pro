import React from 'react';
import { Wallet, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { Account } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  accounts: Account[];
  settings: any;
  onLogout: () => void;
  navItems: { id: string; label: string; icon: any }[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedAccountId,
  setSelectedAccountId,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  accounts,
  settings,
  onLogout,
  navItems
}: SidebarProps) {
  const totalNetWorth = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const isActive = (id: string) => activeTab === id && !selectedAccountId;

  return (
    <>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-canvas border-r border-hairline transition-transform duration-300 ease-in-out md:fixed md:h-screen md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Brand header */}
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-md shadow-primary/20 flex items-center justify-center">
                  <Wallet className="text-white w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-ink tracking-tight">FinTrack</h1>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Institutional</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1.5 text-muted hover:text-ink rounded-lg hover:bg-surface-soft">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-hairline to-transparent mb-2" />

          {/* Navigation cards */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
            {navItems.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedAccountId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden group",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-muted hover:bg-surface-soft hover:text-ink border border-transparent hover:border-hairline"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={cn(
                    "relative z-10 flex items-center gap-3 w-full",
                    active && "text-white"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      active
                        ? "bg-white/15"
                        : "bg-surface-strong group-hover:bg-canvas"
                    )}>
                      <Icon className={cn("w-4 h-4", active ? "text-white" : "text-muted group-hover:text-ink")} />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 space-y-3 border-t border-hairline shrink-0">
            {/* Assets card */}
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10">
              <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mb-1">Total Assets</p>
              <p className="text-lg font-bold text-ink financial-number tracking-tighter">
                {settings.currency}{totalNetWorth.toLocaleString()}
              </p>
            </div>

            {/* Sign out */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-canvas border border-hairline text-muted hover:text-semantic-down hover:border-semantic-down/20 hover:bg-semantic-down/5 transition-all font-semibold text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
