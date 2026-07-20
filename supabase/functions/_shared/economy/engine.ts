// Mirror of src/economy/engine.ts — see types.ts in this folder for why.
import type { EconomyConfig, EconomyResets, EngineStarEvent, RewardGrant, TierConfig, TierId, TierState } from "./types.ts";
import { getTierWindow, type Window } from "./windows.ts";

// The single recursive rule that makes the engine work for any tier-chain
// length with zero code changes: a convert-tier's "earned in window" is a
// measure of the upstream tier *within that same window* (not the upstream
// tier's own native window), floor-divided by the conversion rate. Recursing
// here is what implements "bronze.earnedInWindow computed using silver's
// window." The measure itself is either the upstream's raw star total
// ("stars" unit, the default) or a medal-completion count ("medals" unit) —
// see upstreamMeasure below.
function earnedInWindow(
  tierId: TierId,
  window: Window,
  events: EngineStarEvent[],
  tierById: Map<TierId, TierConfig>,
  resets: EconomyResets
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
  const measure = upstreamMeasure(tier, window, events, tierById, resets);
  return Math.floor(measure / tier.source.rate);
}

// The quantity a convert tier's rate divides: either the upstream tier's raw
// star total in this window ("stars", today's original behavior), or how
// many of the upstream tier's own-kind sub-windows inside this window had
// its target reached ("medals" — e.g. how many bronze-medal days fall
// inside this silver week).
function upstreamMeasure(
  tier: TierConfig,
  window: Window,
  events: EngineStarEvent[],
  tierById: Map<TierId, TierConfig>,
  resets: EconomyResets
): number {
  if (tier.source.type !== "convert") return 0;
  if (tier.source.unit === "medals") {
    const fromTier = tierById.get(tier.source.from);
    return fromTier ? countMedalsInWindow(fromTier, window, events, tierById, resets) : 0;
  }
  return earnedInWindow(tier.source.from, window, events, tierById, resets);
}

// Counts how many of `fromTier`'s own-kind sub-windows, strictly contained
// within the given containing `window`, had `fromTier`'s target reached.
// Sub-windows that straddle the containing window's boundary are skipped
// entirely (not partially credited to either side) — the same
// strict-containment philosophy `earnedInWindow` already applies to raw
// events. A weekly window always decomposes into exactly 7 whole daily
// sub-windows (both are anchored at the same dailyAt time, per windows.ts),
// so this never loses a day when counting bronze medals for silver. A
// monthly window generally does *not* decompose into whole weeks, so a
// week spanning a month boundary won't count toward either month's gold —
// it still shows up as its own standalone silver grant, it just sits out
// of gold's medal count for that month, which is an accepted edge case
// rather than something worth partial-crediting.
function countMedalsInWindow(
  fromTier: TierConfig,
  window: Window,
  events: EngineStarEvent[],
  tierById: Map<TierId, TierConfig>,
  resets: EconomyResets
): number {
  let count = 0;
  let subWindow = getTierWindow(fromTier, window.start, resets);
  let guard = 0;
  while (subWindow.start.getTime() < window.end.getTime() && guard < 100000) {
    guard += 1;
    if (subWindow.start.getTime() >= window.start.getTime() && subWindow.end.getTime() <= window.end.getTime()) {
      const earned = earnedInWindow(fromTier.id, subWindow, events, tierById, resets);
      if (earned >= fromTier.target) count++;
    }
    subWindow = getTierWindow(fromTier, subWindow.end, resets);
  }
  return count;
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
  tierById: Map<TierId, TierConfig>,
  resets: EconomyResets
): string | null {
  const startIso = window.start.toISOString();
  const endIso = window.end.toISOString();
  const relevant = events
    .filter((e) => e.timestamp >= startIso && e.timestamp < endIso)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const prefix: EngineStarEvent[] = [];
  for (const e of relevant) {
    prefix.push(e);
    if (earnedInWindow(tierId, window, prefix, tierById, resets) >= target) {
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
    const earned = earnedInWindow(tier.id, window, events, tierById, config.resets);
    // Rule ג (remainder resets at window end) needs no explicit reset logic:
    // earnedInWindow always sums raw events strictly inside [start, end), so
    // once the window rolls forward, last window's leftover units simply
    // fall outside the new range — the "discard" is an emergent property of
    // window-scoped summation, not something implemented separately here.
    const remainder =
      tier.source.type === "convert"
        ? upstreamMeasure(tier, window, events, tierById, config.resets) % tier.source.rate
        : 0;
    const targetReachedAt = findThresholdCrossing(tier.id, window, tier.target, events, tierById, config.resets);
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
      const earned = earnedInWindow(tier.id, window, events, tierById, config.resets);
      if (earned >= tier.target) {
        const grantedAt = findThresholdCrossing(tier.id, window, tier.target, events, tierById, config.resets);
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
