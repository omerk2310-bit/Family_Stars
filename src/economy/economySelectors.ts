import type { StarEvent as AppStarEvent, RewardClaim } from "../types/entities";
import { computeGrants, computeState } from "./engine";
import { withClaims } from "./claims";
import type { EconomyConfig, EngineStarEvent, RewardGrant, TierId, TierState } from "./types";

function toEngineEvent(e: AppStarEvent): EngineStarEvent {
  return {
    id: e.id,
    childId: e.childId,
    behaviorId: e.behaviorId,
    tierId: "bronze", // every behavior-driven event enters the engine at bronze
    amount: e.pointsAwarded,
    timestamp: e.createdAt,
    source: "parent",
  };
}

// The single place the economyStartsAt cutover is applied — every caller
// filters through here so pre-pivot history never pollutes the new engine's
// windows, without the engine itself needing to know about cutovers at all.
// `childStartsAt` is an optional per-child reset point (Child.starsResetAt,
// set by the "reset stars" tool in Settings) — when present and later than
// the global cutover, it wins, so a reset child starts counting from 0
// again without any old StarEvent rows being deleted.
export function getEconomyEventsForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string,
  childStartsAt?: string
): EngineStarEvent[] {
  const effectiveStartsAt = childStartsAt && childStartsAt > economyStartsAt ? childStartsAt : economyStartsAt;
  // Only approved (or legacy/undefined-status) events count toward tier
  // progress — a child's pending request doesn't affect the cap or grants
  // until a parent approves it, and a rejected one never does.
  return starEvents
    .filter((e) => e.childId === childId && e.createdAt >= effectiveStartsAt && e.status !== "pending" && e.status !== "rejected")
    .map(toEngineEvent);
}

export function getEconomyStateForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string,
  config: EconomyConfig,
  now: Date,
  childStartsAt?: string
): Record<TierId, TierState> {
  const events = getEconomyEventsForChild(childId, starEvents, economyStartsAt, childStartsAt);
  return computeState(events, config, now);
}

export function getGrantsForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string,
  config: EconomyConfig,
  rewardClaims: RewardClaim[],
  now: Date,
  childStartsAt?: string
): RewardGrant[] {
  const events = getEconomyEventsForChild(childId, starEvents, economyStartsAt, childStartsAt);
  const grants = computeGrants(events, config, now);
  return withClaims(grants, rewardClaims);
}
