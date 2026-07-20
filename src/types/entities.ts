import type { EconomyConfig, RewardSize } from "../economy/types";

export interface Child {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
  archived?: boolean;
  // Set by the "reset stars" tool in Settings — a per-child cutover that
  // hides StarEvent history before this point from the economy engine
  // (src/economy/economySelectors.ts) without deleting any rows. Undefined
  // means no reset has ever been applied for this child.
  starsResetAt?: string;
}

export interface Behavior {
  id: string;
  childId: string;
  title: string;
  description: string;
  points: number;
  category: string;
  isBonus: boolean;
  minPoints?: number;
  maxPoints?: number;
  archived?: boolean;
  order: number;
  isGoldStar?: boolean;
}

export type StarEventStatus = "pending" | "approved" | "rejected";

export interface StarEvent {
  id: string;
  childId: string;
  behaviorId: string;
  pointsAwarded: number;
  note?: string;
  createdAt: string;
  isGoldStar: boolean;
  // Children request stars from their own screen; a parent must approve
  // (optionally editing pointsAwarded first) before it counts toward tier
  // progress — see economySelectors.ts's status filter. Legacy/admin-
  // correction rows without a meaningful pending step default to "approved".
  status: StarEventStatus;
}

export interface StarAdjustment {
  id: string;
  childId: string;
  delta: number;
  note?: string;
  createdAt: string;
  isGoldStar?: boolean;
}

export interface HeartEventType {
  id: string;
  title: string;
  description: string;
  hearts: number;
  archived?: boolean;
}

export interface HeartEvent {
  id: string;
  heartEventTypeId: string;
  heartsAwarded: number;
  note?: string;
  createdAt: string;
}

export interface RedEventType {
  id: string;
  childId?: string;
  label: string;
  archived?: boolean;
}

export interface RedEvent {
  id: string;
  childId?: string;
  redEventTypeId: string;
  note?: string;
  createdAt: string;
  wasRepaired: boolean;
  repairStarEventId?: string;
}

export type RewardType = "small" | "medium" | "family";

export interface Reward {
  id: string;
  title: string;
  cost: number;
  type: RewardType;
  description?: string;
  requiresParentApproval: boolean;
  archived?: boolean;
  order: number;
  isGoldStar?: boolean;
}

export type RewardRedemptionStatus = "pending" | "approved" | "rejected";

export interface RewardRedemption {
  id: string;
  rewardId: string;
  childId?: string;
  createdAt: string;
  status: RewardRedemptionStatus;
}

export interface AppSettings {
  dailyStarCap: number;
  dailyHeartCap: number;
  familyHeartTarget: number;
  adminPin?: string;
  economyConfig: EconomyConfig;
  economyStartsAt: string; // set once, server-side, when the cutover migration ran
  economyMigrationShown: boolean; // set once the parent has seen/dismissed the one-time migration screen
}

export interface Entity {
  id: string;
}

// Presence of a row in reward_claims means "a parent marked this grant
// delivered" — id matches the deterministic RewardGrant.id the pure engine
// (src/economy/engine.ts) produces, so this table only ever stores claims,
// never the grants themselves (those are always re-derived from StarEvent
// history, never persisted as their own row).
export interface RewardClaim {
  id: string;
  childId: string;
  tierId: string;
  windowStart: string;
  claimedAt: string;
}

// One-time "closing gift" created during the instant-rewards migration, for
// a child who had a meaningful balance under the old accumulation model.
// Deliberately separate from RewardClaim/the engine — this isn't derived
// from any tier logic, it's a one-off fairness gesture on cutover.
export interface LegacyGrant {
  id: string; // childId — at most one legacy grant per child, ever
  childId: string;
  size: RewardSize;
  sourceNote: string;
  grantedAt: string;
  claimedAt?: string;
}

export interface RewardDefinition {
  id: string; // always equal to size — kept as its own field to satisfy Entity
  size: RewardSize;
  label: string;
  description: string;
  examples: string[];
}
