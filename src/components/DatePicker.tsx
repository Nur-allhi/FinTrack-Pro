import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '../utils/cn';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  mode?: 'date' | 'month';
  placeholder?: string;
  className?: string;
}

const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PANEL_W = 280;
const PANEL_H = 300;

export default function DatePicker({ value, onChange, mode = 'date', placeholder = 'Select date', className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: PANEL_W });

  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewDate, setViewDate] = useState(() => parsed || new Date());

  useEffect(() => {
    if (parsed) setViewDate(parsed);
  }, [value]);

  const close = useCallback(() => setOpen(false), []);

  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const panelW = Math.min(PANEL_W, vw - 48);
    let left = r.left;
    if (left + panelW > vw - 24) left = vw - panelW - 24;
    if (left < 24) left = 24;

    const below = vh - r.bottom;
    const above = r.top;
    const top = below < PANEL_H && above > PANEL_H
      ? Math.max(24, r.top - PANEL_H - 4)
      : r.bottom + 4;

    setPos({ top, left, width: panelW });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      if (portalRef.current && portalRef.current.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open, close]);

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    close();
  };

  const handleMonthClick = (monthIdx: number) => {
    const selected = new Date(viewDate.getFullYear(), monthIdx, 1);
    onChange(format(selected, 'yyyy-MM-dd'));
    close();
  };

  const displayLabel = value
    ? format(parsed!, mode === 'month' ? 'MMM yyyy' : 'dd MMM yyyy')
    : placeholder;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 bg-surface-soft border border-hairline rounded-pill text-xs font-semibold uppercase tracking-wider text-ink hover:bg-canvas hover:border-muted transition-all cursor-pointer"
      >
        <span className="truncate">{displayLabel}</span>
        {mode === 'month' ? <CalendarDays className="w-3.5 h-3.5 text-muted shrink-0" /> : <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />}
      </button>
      {open && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-canvas border border-hairline rounded-xl shadow-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(mode === 'month' ? subYears(viewDate, 1) : subMonths(viewDate, 1))} className="p-1 hover:bg-surface-soft rounded-full transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted" />
            </button>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              {mode === 'month' ? format(viewDate, 'yyyy') : format(viewDate, 'MMMM yyyy')}
            </span>
            <button type="button" onClick={() => setViewDate(mode === 'month' ? addYears(viewDate, 1) : addMonths(viewDate, 1))} className="p-1 hover:bg-surface-soft rounded-full transition-colors">
              <ChevronRight className="w-4 h-4 text-muted" />
            </button>
          </div>
          {mode === 'month' ? (
            <div className="grid grid-cols-4 gap-2">
              {months.map((m, i) => {
                const isSelected = parsed && parsed.getMonth() === i && parsed.getFullYear() === viewDate.getFullYear();
                const isCurrent = new Date().getMonth() === i && new Date().getFullYear() === viewDate.getFullYear();
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthClick(i)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-semibold transition-colors",
                      isSelected ? "bg-primary text-white" : isCurrent ? "ring-1 ring-primary text-ink" : "text-ink hover:bg-surface-soft"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {dayHeaders.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-muted uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const isSelected = parsed && isSameDay(day, parsed);
                  const isOutside = !isSameMonth(day, viewDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "w-full aspect-square flex items-center justify-center text-xs rounded-full transition-colors",
                        isOutside ? "text-muted/30" : isSelected ? "bg-primary text-white font-bold" : "text-ink hover:bg-surface-soft",
                        today && !isSelected && "ring-1 ring-primary font-bold"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
