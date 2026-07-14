import type { RewardGrant } from "./types";

// computeGrants() always returns claimedAt: null by construction — it's a
// pure function derived from StarEvent history alone and has no access to
// (nor any business being aware of) the separately-persisted claims table.
// This join is the one place a grant's real claimedAt gets attached, for
// display and for filtering "still pending delivery" lists.
export interface ClaimRecord {
  id: string;
  claimedAt: string;
}

export function withClaims(grants: RewardGrant[], claims: ClaimRecord[]): RewardGrant[] {
  const byId = new Map(claims.map((c) => [c.id, c.claimedAt]));
  return grants.map((g) => ({ ...g, claimedAt: byId.get(g.id) ?? null }));
}
