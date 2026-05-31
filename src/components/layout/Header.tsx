import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, X, Sun, Moon, Receipt, Handshake } from 'lucide-react';
import { cn } from '../../utils/cn';
import { authService } from '../../services/authService';

interface SearchResult {
  type: 'account' | 'member' | 'transaction' | 'loan';
  id: number;
  label: string;
  sublabel: string;
  amount?: number;
  accountId?: number;
}

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
  selectedAccountId: number | null;
  activeTabLabel: string | undefined;
  accounts: { id: number; name: string; type: string; member_name?: string }[];
  members: { id: number; name: string; relationship?: string }[];
  onSearchSelect: (type: string, id: number, accountId?: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({
  setIsMobileMenuOpen,
  selectedAccountId,
  activeTabLabel,
  accounts,
  members,
  onSearchSelect,
  darkMode,
  onToggleDarkMode
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authService.apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.map((r: any) => ({
            type: r.type,
            id: r.id,
            label: r.title,
            sublabel: r.subtitle,
            amount: r.amount,
            accountId: r.accountId,
          })));
        }
      } catch {
        // Fallback to local search
        const q = query.toLowerCase();
        const accountResults: SearchResult[] = accounts
          .filter(a => a.name.toLowerCase().includes(q))
          .slice(0, 3)
          .map(a => ({ type: 'account', id: a.id, label: a.name, sublabel: a.type.replace('_', ' ') }));
        const memberResults: SearchResult[] = members
          .filter(m => m.name.toLowerCase().includes(q))
          .slice(0, 2)
          .map(m => ({ type: 'member', id: m.id, label: m.name, sublabel: m.relationship || 'Member' }));
        setResults([...accountResults, ...memberResults]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, accounts, members]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (r: SearchResult) => {
    setQuery('');
    setResults([]);
    setFocused(false);
    onSearchSelect(r.type, r.id, r.accountId);
  };

  return (
    <header className="h-14 md:h-16 bg-canvas border-b border-hairline flex items-center justify-between px-4 md:px-8 lg:px-12 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-1.5 text-muted hover:bg-surface-soft rounded-pill"
        >
          <Menu className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h2 className="text-base md:text-xl font-normal text-ink tracking-tight">
          {selectedAccountId ? 'Ledger' : activeTabLabel}
        </h2>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-muted hover:bg-surface-soft rounded-pill transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
        </button>

        {/* Search */}
        <div ref={ref} className="relative">
        <div className={cn(
          "flex items-center gap-2 bg-surface-soft rounded-pill border border-hairline transition-all",
          focused ? "border-primary bg-canvas shadow-sm" : "hover:border-muted"
        )}>
          <Search className="w-3.5 h-3.5 text-muted ml-3 md:ml-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-xs text-ink font-medium py-2 pr-2 w-24 md:w-36 lg:w-48 placeholder:text-muted/60"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="p-1 text-muted hover:text-ink mr-1">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {focused && (results.length > 0 || searching) && (
          <div className="absolute top-full right-0 mt-1.5 w-64 md:w-80 bg-canvas border border-hairline rounded-xl shadow-xl overflow-hidden z-50">
            {searching && (
              <div className="px-4 py-3 text-xs text-muted flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Searching...
              </div>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  i < results.length - 1 && "border-b border-hairline/50",
                  "hover:bg-surface-soft"
                )}
              >
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                  r.type === 'account' ? "bg-primary/5 text-primary" :
                  r.type === 'transaction' ? "bg-amber-50 text-amber-600" :
                  r.type === 'loan' ? "bg-violet-50 text-violet-600" :
                  "bg-surface-strong text-muted"
                )}>
                  {r.type === 'account' ? 'ACC' : r.type === 'transaction' ? 'TX' : r.type === 'loan' ? 'LOAN' : 'MEM'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{r.label}</p>
                  <p className="text-xs text-muted truncate">{r.sublabel}</p>
                </div>
                {r.amount !== undefined && (
                  <span className="text-xs font-bold text-muted financial-number shrink-0">
                    {r.amount >= 0 ? '+' : ''}{r.amount.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
