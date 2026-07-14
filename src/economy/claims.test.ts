import { describe, expect, it } from "vitest";
import { withClaims } from "./claims";
import type { RewardGrant } from "./types";

function grant(id: string): RewardGrant {
  return { id, childId: "child1", tierId: "bronze", size: "small", windowStart: "x", grantedAt: "y", claimedAt: null };
}

describe("withClaims", () => {
  it("attaches claimedAt for grants with a matching claim record", () => {
    const result = withClaims([grant("a"), grant("b")], [{ id: "a", claimedAt: "2026-07-14T10:00:00.000Z" }]);
    expect(result.find((g) => g.id === "a")?.claimedAt).toBe("2026-07-14T10:00:00.000Z");
    expect(result.find((g) => g.id === "b")?.claimedAt).toBeNull();
  });

  it("leaves claimedAt null when there is no claim record at all", () => {
    const result = withClaims([grant("a")], []);
    expect(result[0].claimedAt).toBeNull();
  });
});
