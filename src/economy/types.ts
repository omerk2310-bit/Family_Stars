export type TierId = string;
export type WindowKind = "daily" | "weekly" | "monthly";
export type RewardSize = "small" | "medium" | "large";

// unit controls what a convert tier's `rate` divides: "stars" (default,
// omit for backward compatibility) divides the upstream tier's raw star
// total within this tier's own window, exactly as before. "medals" divides
// a *count of upstream medal completions* instead — how many of the
// upstream tier's own-kind sub-windows (e.g. days, for a weekly tier
// converting from a daily one) had that tier's target reached, within this
// tier's window.
export type TierSource =
  | { type: "behavior" }
  | { type: "convert"; from: TierId; rate: number; unit?: "stars" | "medals" };

export interface TierConfig {
  id: TierId;
  label: string;
  icon: string;
  color: string;
  source: TierSource;
  window: WindowKind;
  target: number;
  reward: RewardSize;
  consumesSource: boolean;
  rolloverRemainder: boolean;
  order: number;
  // When true, the target also acts as a hard ceiling for this tier: once
  // reached, no further behavior-driven logging is allowed for the rest of
  // the window (only meaningful for behavior-source tiers — enforced at
  // logging time, not by the engine itself, since the engine only derives
  // totals from events that already exist).
  capped: boolean;
}

export interface EconomyResets {
  dailyAt: string; // "HH:MM", local time
  weekStartsOn: number; // 0 = Sunday
  monthStartsOnDay: number; // 1-31, clamped per-month
}

export interface EconomyConfig {
  tiers: TierConfig[];
  resets: EconomyResets;
}

// Engine-internal event shape — a thin, purpose-built contract for the pure
// engine functions. The app's real StarEvent (src/types/entities.ts) is
// adapted into this shape by the caller (see economySelectors.ts), since the
// two types serve different layers and don't need to be the same interface.
export interface EngineStarEvent {
  id: string;
  childId: string;
  behaviorId: string;
  tierId: TierId;
  amount: number;
  timestamp: string; // ISO
  source: "parent" | "child" | "admin";
}

export interface TierState {
  tierId: TierId;
  earned: number;
  remainder: number;
  target: number;
  targetReachedAt: string | null;
  windowStart: string;
  windowEnd: string;
}

export interface RewardGrant {
  id: string;
  childId: string;
  tierId: TierId;
  size: RewardSize;
  windowStart: string;
  grantedAt: string;
  claimedAt: string | null;
}
