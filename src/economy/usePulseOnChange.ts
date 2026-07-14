import { useEffect, useRef, useState } from "react";

// Returns true for `durationMs` every time `value` changes (never on the
// initial mount) — used to flash a "spring" CSS class on a counter without
// needing to track cross-screen element positions.
export function usePulseOnChange<T>(value: T, durationMs = 400): boolean {
  const [pulsing, setPulsing] = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), durationMs);
    return () => clearTimeout(timer);
  }, [value, durationMs]);

  return pulsing;
}
