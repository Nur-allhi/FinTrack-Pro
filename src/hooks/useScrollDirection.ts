import { useState, useEffect, useRef, useCallback } from 'react';

export function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    isMobile.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { isMobile.current = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const onScroll = useCallback(() => {
    if (!isMobile.current || ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      const y = el ? el.scrollTop : 0;
      if (y < 10) {
        setVisible(true);
      } else if (y > lastScrollY.current + 5) {
        setVisible(false);
      } else if (y < lastScrollY.current - 5) {
        setVisible(true);
      }
      lastScrollY.current = y;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return { visible, scrollRef };
}
