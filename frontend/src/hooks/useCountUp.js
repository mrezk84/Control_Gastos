import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up from its previous value to `value`
 * over `duration` ms. Used for KPI cards so numbers feel alive instead
 * of just popping in.
 */
export function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(value || 0);
  const frameRef = useRef(null);
  const fromRef = useRef(value || 0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
