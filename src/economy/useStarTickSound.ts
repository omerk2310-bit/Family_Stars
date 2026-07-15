import { useEffect, useRef } from "react";
import { playStarTick, vibrateShort } from "./audio";

// Watches a capped tier's `earned` count and plays the tick sound whenever it
// rises — mirrors useNewGrantCelebration's ref-diff/anti-replay-on-mount
// pattern so reopening the screen mid-window doesn't replay ticks for stars
// already logged. Meant to be mounted only on the child's own screen: earned
// changes live via realtime sync even though the child never taps anything.
export function useStarTickSound(earned: number, target: number): void {
  const lastEarned = useRef<number | null>(null);

  useEffect(() => {
    if (lastEarned.current === null) {
      lastEarned.current = earned;
      return;
    }
    if (earned > lastEarned.current) {
      playStarTick(earned, target);
      vibrateShort();
    }
    lastEarned.current = earned;
  }, [earned, target]);
}
