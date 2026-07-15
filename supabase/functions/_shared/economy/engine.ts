// Mirror of src/economy/engine.ts — see types.ts in this folder for why.
import type { EconomyConfig, EngineStarEvent, RewardGrant, TierConfig, TierId, TierState } from "./types";
import { getTierWindow, type Window } from "./windows";

// The single recursive rule that makes the engine work for any tier-chain
// length with zero code changes: a convert-tier's "earned in window" is the
// upstream tier's total *within that same window* (not the upstream tier's
// own native window), floor-divided by the conversion rate. Recursing here
// is what implements "bronze.earnedInWindow computed using silver's window."
function earnedInWindow(
  tierId: TierId,
  window: Window,
  events: EngineStarEvent[],
  tierById: Map<TierId, TierConfig>
): number {
  const tier = tierById.get(tierId);
  if (!tier) return 0;
  const startIso = window.start.toISOString();
  const endIso = window.end.toISOString();
  if (tier.source.type === "behavior") {
    return events
      .filter((e) => e.tierId === tierId && e.timestamp >= startIso && e.timestamp < endIso)
      .reduce((sum, e) => sum + e.amount, 0);
  }
  const upstreamTotal = earnedInWindow(tier.source.from, window, events, tierById);
  return Math.floor(upstreamTotal / tier.source.rate);
}

// Finds the timestamp of the event that first pushed a tier's window total
// to/past its target, by replaying events chronologically. Works uniformly
// for any tier depth since it just re-runs earnedInWindow on a growing
// prefix of events.
function findThresholdCrossing(
  tierId: TierId,
  window: Window,
  target: number,
  events: EngineStarEvent[],
  tierById: Map<TierId, TierConfig>
): string | null {
  const startIso = window.start.toISOString();
  const endIso = window.end.toISOString();
  const relevant = events
    .filter((e) => e.timestamp >= startIso && e.timestamp < endIso)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const prefix: EngineStarEvent[] = [];
  for (const e of relevant) {
    prefix.push(e);
    if (earnedInWindow(tierId, window, prefix, tierById) >= target) {
      return e.timestamp;
    }
  }
  return null;
}

export function computeState(events: EngineStarEvent[], config: EconomyConfig, now: Date): Record<TierId, TierState> {
  const tierById = new Map(config.tiers.map((t) => [t.id, t]));
  const result: Record<TierId, TierState> = {};
  for (const tier of config.tiers) {
    const window = getTierWindow(tier, now, config.resets);
    const earned = earnedInWindow(tier.id, window, events, tierById);
    // Rule ג (remainder resets at window end) needs no explicit reset logic:
    // earnedInWindow always sums raw events strictly inside [start, end), so
    // once the window rolls forward, last window's leftover units simply
    // fall outside the new range — the "discard" is an emergent property of
    // window-scoped summation, not something implemented separately here.
    const remainder =
      tier.source.type === "convert" ? earnedInWindow(tier.source.from, window, events, tierById) % tier.source.rate : 0;
    const targetReachedAt = findThresholdCrossing(tier.id, window, tier.target, events, tierById);
    result[tier.id] = {
      tierId: tier.id,
      earned,
      remainder,
      target: tier.target,
      targetReachedAt,
      windowStart: window.start.toISOString(),
      windowEnd: window.end.toISOString(),
    };
  }
  return result;
}

export function computeGrants(events: EngineStarEvent[], config: EconomyConfig, now: Date): RewardGrant[] {
  if (events.length === 0) return [];
  const tierById = new Map(config.tiers.map((t) => [t.id, t]));
  const childId = events[0].childId;

  const grants: RewardGrant[] = [];
  const earliestMs = Math.min(...events.map((e) => new Date(e.timestamp).getTime()));
  const earliest = new Date(earliestMs);

  for (const tier of config.tiers) {
    let window = getTierWindow(tier, earliest, config.resets);
    const nowWindow = getTierWindow(tier, now, config.resets);

    // Walk every window from the earliest event through (and including) the
    // current one, so a grant from a past window the parent never marked
    // delivered still shows up on every recomputation, not just today's.
    let guard = 0;
    while (window.start.getTime() <= nowWindow.start.getTime() && guard < 100000) {
      guard += 1;
      const earned = earnedInWindow(tier.id, window, events, tierById);
      if (earned >= tier.target) {
        const grantedAt = findThresholdCrossing(tier.id, window, tier.target, events, tierById);
        if (grantedAt) {
          grants.push({
            // Deterministic id: the same real-world grant always recomputes
            // to the same id, which is what makes claim-tracking (a separate
            // persisted table, joined in by the caller) safe and idempotent.
            id: `${childId}:${tier.id}:${window.start.toISOString()}`,
            childId,
            tierId: tier.id,
            size: tier.reward,
            windowStart: window.start.toISOString(),
            grantedAt,
            claimedAt: null,
          });
        }
      }
      window = getTierWindow(tier, window.end, config.resets);
    }
  }

  return grants.sort((a, b) => a.grantedAt.localeCompare(b.grantedAt));
}
