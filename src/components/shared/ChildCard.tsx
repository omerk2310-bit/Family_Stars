import type { CSSProperties } from "react";
import type { Child } from "../../types/entities";
import type { EconomyConfig, TierId, TierState } from "../../economy/types";
import { ChildAvatar } from "./ChildAvatar";
import { TierProgressRow } from "../../economy/TierProgressRow";
import "./ChildCard.css";

interface ChildCardProps {
  child: Child;
  config: EconomyConfig;
  state: Record<TierId, TierState>;
}

// Status-only display — no navigation. Star logging is now the child's own
// action (RestrictedChildScreen), so there's nothing for a parent to "go
// into" from this card anymore. Surfaces all 3 tier rings (previously only
// shown on the now-removed parent logging screen), not just bronze as text.
export function ChildCard({ child, config, state }: ChildCardProps) {
  return (
    <div className="child-card" style={{ "--child-accent": child.color } as CSSProperties}>
      <ChildAvatar icon={child.icon} color={child.color} size="lg" />
      <span className="child-card__name">{child.displayName}</span>
      <TierProgressRow config={config} state={state} />
    </div>
  );
}
