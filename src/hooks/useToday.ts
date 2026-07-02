import { useEffect, useState } from "react";

/** Current date, refreshed periodically so day/week boundaries stay correct in long-lived sessions. */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return today;
}
