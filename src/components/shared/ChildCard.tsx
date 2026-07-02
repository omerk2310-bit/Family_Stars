import type { CSSProperties } from "react";
import type { Child } from "../../types/entities";
import { ChildAvatar } from "./ChildAvatar";
import "./ChildCard.css";

interface ChildCardProps {
  child: Child;
  availableStars: number;
  todayStars: number;
  dailyCap: number;
  onClick: () => void;
}

export function ChildCard({ child, availableStars, todayStars, dailyCap, onClick }: ChildCardProps) {
  return (
    <button
      type="button"
      className="child-card"
      style={{ "--child-accent": child.color } as CSSProperties}
      onClick={onClick}
    >
      <ChildAvatar icon={child.icon} color={child.color} size="lg" />
      <span className="child-card__name">{child.displayName}</span>
      <span className="child-card__stars">⭐ {availableStars} כוכבים זמינים</span>
      <span className="child-card__today">היום: {todayStars} מתוך {dailyCap}</span>
    </button>
  );
}
