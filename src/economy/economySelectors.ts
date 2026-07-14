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
export function getEconomyEventsForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string
): EngineStarEvent[] {
  return starEvents.filter((e) => e.childId === childId && e.createdAt >= economyStartsAt).map(toEngineEvent);
}

export function getEconomyStateForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string,
  config: EconomyConfig,
  now: Date
): Record<TierId, TierState> {
  const events = getEconomyEventsForChild(childId, starEvents, economyStartsAt);
  return computeState(events, config, now);
}

export function getGrantsForChild(
  childId: string,
  starEvents: AppStarEvent[],
  economyStartsAt: string,
  config: EconomyConfig,
  rewardClaims: RewardClaim[],
  now: Date
): RewardGrant[] {
  const events = getEconomyEventsForChild(childId, starEvents, economyStartsAt);
  const grants = computeGrants(events, config, now);
  return withClaims(grants, rewardClaims);
}
