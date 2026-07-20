import type { CSSProperties } from "react";
import type { Child } from "../../types/entities";
import { ChildAvatar } from "./ChildAvatar";
import "./ChildCard.css";

interface ChildCardProps {
  child: Child;
  bronzeEarnedToday: number;
  bronzeTarget: number;
}

// Status-only display — no navigation. Star logging is now the child's own
// action (RestrictedChildScreen), so there's nothing for a parent to "go
// into" from this card anymore.
export function ChildCard({ child, bronzeEarnedToday, bronzeTarget }: ChildCardProps) {
  return (
    <div className="child-card" style={{ "--child-accent": child.color } as CSSProperties}>
      <ChildAvatar icon={child.icon} color={child.color} size="lg" />
      <span className="child-card__name">{child.displayName}</span>
      <span className="child-card__today">
        🥉 היום: {bronzeEarnedToday} מתוך {bronzeTarget}
      </span>
    </div>
  );
}
