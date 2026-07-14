import type { CSSProperties } from "react";
import type { Child } from "../../types/entities";
import { ChildAvatar } from "./ChildAvatar";
import "./ChildCard.css";

interface ChildCardProps {
  child: Child;
  bronzeEarnedToday: number;
  bronzeTarget: number;
  onClick: () => void;
}

export function ChildCard({ child, bronzeEarnedToday, bronzeTarget, onClick }: ChildCardProps) {
  return (
    <button
      type="button"
      className="child-card"
      style={{ "--child-accent": child.color } as CSSProperties}
      onClick={onClick}
    >
      <ChildAvatar icon={child.icon} color={child.color} size="lg" />
      <span className="child-card__name">{child.displayName}</span>
      <span className="child-card__today">
        🥉 היום: {bronzeEarnedToday} מתוך {bronzeTarget}
      </span>
    </button>
  );
}
