import React from 'react';
import { X, LogOut, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  settings: { darkMode: boolean; fontSize: string; currency: string };
  onLogout: () => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  userEmail?: string;
  showProfile?: boolean;
  onOpenProfile?: () => void;
  setShowProfile?: (show: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedAccountId,
  setSelectedAccountId,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  settings,
  onLogout,
  navItems,
  userEmail,
  showProfile,
  onOpenProfile,
  setShowProfile
}: SidebarProps) {
  const isActive = (id: string) => activeTab === id && !selectedAccountId && !showProfile;

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
          <div className="flex items-center justify-between px-5 py-5">
            <button onClick={() => window.location.reload()} className="flex items-end gap-2.5 min-w-0 cursor-pointer">
              <svg viewBox="0 0 512 512" className="w-11 h-11 shrink-0 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                <rect width="512" height="512" rx="110" fill="#FFFFFF" />
                <g opacity="0.08">
                  <circle cx="128" cy="128" r="2" fill="#0D1C45"/>
                  <circle cx="256" cy="128" r="2" fill="#0D1C45"/>
                  <circle cx="384" cy="128" r="2" fill="#0D1C45"/>
                  <circle cx="128" cy="256" r="2" fill="#0D1C45"/>
                  <circle cx="256" cy="256" r="2" fill="#0D1C45"/>
                  <circle cx="384" cy="256" r="2" fill="#0D1C45"/>
                  <circle cx="128" cy="384" r="2" fill="#0D1C45"/>
                  <circle cx="256" cy="384" r="2" fill="#0D1C45"/>
                  <circle cx="384" cy="384" r="2" fill="#0D1C45"/>
                </g>
                <rect x="108" y="300" width="72" height="130" rx="14" fill="#0D1C45"/>
                <rect x="220" y="235" width="72" height="195" rx="14" fill="#0D1C45"/>
                <rect x="332" y="152" width="72" height="278" rx="14" fill="#0D1C45"/>
                <polyline points="144,296 256,231 368,148" fill="none" stroke="#1ED47A" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="144" cy="296" r="9" fill="#1ED47A"/>
                <circle cx="256" cy="231" r="9" fill="#1ED47A"/>
                <circle cx="368" cy="148" r="18" fill="#1ED47A"/>
                <circle cx="368" cy="148" r="9" fill="#FFFFFF"/>
              </svg>
              <span className="text-xl md:text-2xl font-bold text-ink leading-none cursor-pointer" style={{fontFamily: "'Roboto Slab', serif", textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>FinTrack <span className="text-[#34d399] font-normal">Pro</span></span>
            </button>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1.5 text-muted hover:text-ink rounded-lg hover:bg-surface-soft shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-hairline to-transparent mb-2" />

          {/* Navigation cards */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
            <LayoutGroup>
              {navItems.map((item) => {
                const active = isActive(item.id);
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    layout
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedAccountId(null);
                      setIsMobileMenuOpen(false);
                      if (setShowProfile) setShowProfile(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden group",
                      active
                        ? "text-white shadow-md shadow-primary/20"
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
            </LayoutGroup>
          </nav>

          {/* Bottom section */}
          <div className="p-4 space-y-3 border-t border-hairline shrink-0">
            {/* Profile section */}
            {userEmail && (
              <button onClick={onOpenProfile} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-soft border border-hairline hover:bg-surface-strong transition-all text-left">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{userEmail[0].toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate">{localStorage.getItem('user_name') || userEmail.split('@')[0]}</p>
                  <p className="text-[10px] text-muted truncate">{userEmail}</p>
                  <p className="text-[9px] text-muted/40 mt-0.5">v{document.querySelector('meta[name="app-version"]')?.getAttribute('content') || ''}</p>
                </div>
              </button>
            )}

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
