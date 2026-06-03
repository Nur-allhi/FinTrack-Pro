import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';

interface AnimatedBalanceProps {
  value: number;
  currency?: string;
  className?: string;
}

export default function AnimatedBalance({ value, currency = '', className }: AnimatedBalanceProps) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value === prevRef.current) return;
    const dir = value > prevRef.current ? 'up' : 'down';
    prevRef.current = value;
    setFlash(dir);
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      className={cn(
        'financial-number transition-colors duration-700',
        flash === 'up' && 'text-semantic-up',
        flash === 'down' && 'text-semantic-down',
        !flash && 'text-ink',
        className
      )}
    >
      {currency}{value.toLocaleString()}
    </span>
  );
}
