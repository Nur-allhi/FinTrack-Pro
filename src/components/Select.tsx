import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const close = useCallback(() => setOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      minWidth: '200px',
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open, close]);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label || placeholder || 'Select...';

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 bg-surface-soft border border-hairline rounded-pill text-xs font-semibold uppercase tracking-wider text-ink hover:bg-canvas hover:border-muted transition-all cursor-pointer"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && createPortal(
        <div style={menuStyle} className="bg-canvas border border-hairline rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(String(opt.value)); close(); }}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm transition-colors",
                opt.value === value
                  ? "bg-primary/5 text-primary font-semibold"
                  : "text-ink hover:bg-surface-soft font-medium"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
