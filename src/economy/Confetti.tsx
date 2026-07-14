import { useMemo } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import "./celebrate.css";

interface ConfettiProps {
  pieceCount?: number;
}

const COLORS = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a78bfa", "#f472b6", "#34d399"];

// Remount this component (change its `key` prop) each time you want it to
// replay — it has no internal "play again" API, matching the standard React
// idiom for one-shot effects.
export function Confetti({ pieceCount = 24 }: ConfettiProps) {
  const reducedMotion = usePrefersReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      })),
    [pieceCount]
  );

  if (reducedMotion) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
