import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return undefined;

    const duration = 500;
    const start = performance.now();
    let frame;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.round(from + (to - from) * progress);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}
