import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table-row' | 'chart' | 'dashboard' | 'text' | 'avatar';
  count?: number;
  className?: string;
}

interface SkeletonBarProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBar({ className, style }: SkeletonBarProps) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-md bg-surface-strong before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export default function SkeletonLoader({ variant = 'text', count = 1, className }: SkeletonLoaderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ready) return null;

  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((_, i) => (
          <div key={i} className="rounded-xl border border-hairline bg-canvas p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBar className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-4 w-3/5" />
                <SkeletonBar className="h-3 w-2/5" />
              </div>
            </div>
            <SkeletonBar className="h-3 w-full" />
            <SkeletonBar className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBar className="h-3 w-1/6" />
            <SkeletonBar className="h-3 w-2/6" />
            <SkeletonBar className="h-3 w-1/6" />
            <SkeletonBar className="h-3 w-1/6 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonBar
              key={i}
              className="flex-1"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {items.map((_, i) => (
          <div key={i} className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
            <SkeletonBar className="h-3 w-1/3" />
            <SkeletonBar className="h-6 w-1/2" />
            <SkeletonBar className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBar className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((_, i) => (
        <SkeletonBar key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
