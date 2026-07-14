import { useEffect } from "react";
import { Confetti } from "./Confetti";
import { playTierAchievement, vibrateShort } from "./audio";
import type { TierId } from "./types";
import "./celebrate.css";

interface TierCelebrationProps {
  tierId: TierId;
  label: string;
  icon: string;
  onDone: () => void;
}

// Three distinct, escalating celebrations per the spec: bronze is brief,
// silver fuller, gold is the big one — auto-dismiss timing scales with it.
const AUTO_DISMISS_MS: Record<string, number> = {
  bronze: 1800,
  silver: 2400,
  gold: 3200,
};

const CONFETTI_COUNT: Record<string, number> = {
  bronze: 24,
  silver: 40,
  gold: 60,
};

export function TierCelebration({ tierId, label, icon, onDone }: TierCelebrationProps) {
  useEffect(() => {
    playTierAchievement(tierId);
    vibrateShort();
    const timer = setTimeout(onDone, AUTO_DISMISS_MS[tierId] ?? 2000);
    return () => clearTimeout(timer);
    // Only replay when the tier identity actually changes, not on every
    // parent re-render.
  }, [tierId]);

  return (
    <div className="economy-fullscreen-celebration" onClick={onDone} role="status">
      <Confetti pieceCount={CONFETTI_COUNT[tierId] ?? 24} />
      <div className="economy-fullscreen-celebration__icon">{icon}</div>
      <p className="economy-fullscreen-celebration__title">הגעת ליעד {label}! 🎉</p>
    </div>
  );
}
