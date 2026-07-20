import type { Behavior } from "../../types/entities";
import "./BehaviorButton.css";

interface BehaviorButtonProps {
  behavior: Behavior;
  disabled?: boolean;
  onClick: () => void;
}

export function BehaviorButton({ behavior, disabled, onClick }: BehaviorButtonProps) {
  const pointsLabel = `${behavior.points} ⭐`;

  return (
    <button type="button" className="behavior-button" disabled={disabled} onClick={onClick}>
      <div className="behavior-button__main">
        <span className="behavior-button__title">{behavior.title}</span>
        {behavior.description && <span className="behavior-button__desc">{behavior.description}</span>}
      </div>
      <div className="behavior-button__meta">
        <span className="behavior-button__points">{pointsLabel}</span>
        {behavior.isBonus && <span className="behavior-button__bonus-tag">בונוס</span>}
      </div>
    </button>
  );
}
