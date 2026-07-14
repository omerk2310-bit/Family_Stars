import type { TierConfig, TierState } from "./types";
import "./TierRing.css";

interface TierRingProps {
  tier: TierConfig;
  state: TierState;
  size?: number;
}

export function TierRing({ tier, state, size = 96 }: TierRingProps) {
  const pct = state.target > 0 ? Math.min(1, state.earned / state.target) : 0;
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="tier-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} className="tier-ring__track" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="tier-ring__progress"
          style={{ stroke: tier.color, strokeDasharray: circumference, strokeDashoffset: offset }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="tier-ring__center">
        <span className="tier-ring__icon">{tier.icon}</span>
        <span className="tier-ring__value">
          {state.earned}/{state.target}
        </span>
      </div>
    </div>
  );
}
