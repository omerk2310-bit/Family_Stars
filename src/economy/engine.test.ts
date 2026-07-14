import { describe, expect, it } from "vitest";
import { computeGrants, computeState } from "./engine";
import { DEFAULT_ECONOMY_CONFIG } from "./defaultConfig";
import type { EconomyConfig, EngineStarEvent } from "./types";
import { dailyWindow, monthlyWindow, weeklyWindow } from "./windows";

// Builds a local-time Date the same way the engine itself constructs window
// boundaries, so tests stay correct regardless of the runner's timezone.
function local(y: number, mo: number, d: number, h = 0, m = 0): Date {
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

function localIso(y: number, mo: number, d: number, h = 0, m = 0): string {
  return local(y, mo, d, h, m).toISOString();
}

function bronzeEvent(childId: string, amount: number, timestamp: string, id: string): EngineStarEvent {
  return { id, childId, behaviorId: "b1", tierId: "bronze", amount, timestamp, source: "parent" };
}

const config = DEFAULT_ECONOMY_CONFIG;

describe("window boundaries", () => {
  it("dailyWindow returns a 1-calendar-day window anchored at dailyAt", () => {
    const now = local(2026, 7, 14, 15, 30);
    const { start, end } = dailyWindow(now, "00:00");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6);
    expect(start.getDate()).toBe(14);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(15);
    expect(end.getHours()).toBe(0);
  });

  it("dailyWindow before the daily reset time uses the previous day's start", () => {
    const now = local(2026, 7, 14, 0, 30); // 00:30, reset is 06:00
    const { start } = dailyWindow(now, "06:00");
    expect(start.getDate()).toBe(13);
    expect(start.getHours()).toBe(6);
  });

  it("weeklyWindow anchors to weekStartsOn (Sunday=0)", () => {
    // 2026-07-14 is a Tuesday
    const now = local(2026, 7, 14, 12, 0);
    const { start, end } = weeklyWindow(now, "00:00", 0);
    expect(start.getDay()).toBe(0);
    expect(start.getDate()).toBe(12); // the preceding Sunday
    expect(end.getDate()).toBe(19); // 7 days later
  });

  it("monthlyWindow clamps monthStartsOnDay to days-in-month (Feb 31 -> Feb 28/29)", () => {
    // now sits exactly at February's clamped reset moment (2026 is not a leap year)
    const now = local(2026, 2, 28, 12, 0);
    const { start, end } = monthlyWindow(now, "00:00", 31);
    expect(start.getMonth()).toBe(1); // February
    expect(start.getDate()).toBe(28);
    expect(end.getMonth()).toBe(2); // March
    expect(end.getDate()).toBe(31);
  });

  it("monthlyWindow before the clamped reset day falls back into the previous month's window", () => {
    // Feb 15 is before this month's clamped reset (the 28th), so it's still
    // inside the window that began on January 31st.
    const now = local(2026, 2, 15, 12, 0);
    const { start, end } = monthlyWindow(now, "00:00", 31);
    expect(start.getMonth()).toBe(0); // January
    expect(start.getDate()).toBe(31);
    expect(end.getMonth()).toBe(1); // February
    expect(end.getDate()).toBe(28);
  });

  it("monthlyWindow before monthStartsOnDay uses the previous month, crossing a year boundary correctly", () => {
    const now = local(2026, 1, 5, 12, 0); // Jan 5, reset day is the 15th
    const { start, end } = monthlyWindow(now, "00:00", 15);
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(11); // December
    expect(start.getDate()).toBe(15);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getDate()).toBe(15);
  });
});

describe("computeState — sanity checks from spec", () => {
  it("a perfect day (10 bronze) yields 3 silver with remainder 1, gold untouched", () => {
    const events: EngineStarEvent[] = Array.from({ length: 10 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, i), `e${i}`)
    );
    const now = local(2026, 7, 14, 20, 0);
    const state = computeState(events, config, now);

    expect(state.bronze.earned).toBe(10);
    expect(state.bronze.target).toBe(10);
    expect(state.bronze.targetReachedAt).not.toBeNull();

    expect(state.silver.earned).toBe(3);
    expect(state.silver.remainder).toBe(1);
    expect(state.silver.targetReachedAt).toBeNull(); // target 15, not reached

    expect(state.gold.earned).toBe(0);
  });

  it("an 11-bronze day yields 3 silver with remainder 2 (matches spec's worked example)", () => {
    const events: EngineStarEvent[] = Array.from({ length: 11 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, i), `e${i}`)
    );
    const now = local(2026, 7, 14, 20, 0);
    const state = computeState(events, config, now);

    expect(state.bronze.earned).toBe(11);
    expect(state.silver.earned).toBe(3);
    expect(state.silver.remainder).toBe(2);
  });

  it("remainder does not roll over to the next day (discarded at window end)", () => {
    // 11 bronze today (remainder 2 within this week), 10 bronze tomorrow —
    // same week, so silver is computed once for the whole week: (11+10)/3.
    const events: EngineStarEvent[] = [
      ...Array.from({ length: 11 }, (_, i) => bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, i), `d1-${i}`)),
      ...Array.from({ length: 10 }, (_, i) => bronzeEvent("child1", 1, localIso(2026, 7, 15, 8, i), `d2-${i}`)),
    ];
    const now = local(2026, 7, 15, 20, 0);
    const state = computeState(events, config, now);

    // 21 total bronze this week -> floor(21/3) = 7, remainder 0 (not 2+? "leftover")
    expect(state.silver.earned).toBe(7);
    expect(state.silver.remainder).toBe(0);
  });

  it("a zero-activity child produces all-zero state with no NaN/crash", () => {
    const state = computeState([], config, local(2026, 7, 14, 12, 0));
    expect(state.bronze).toEqual({
      tierId: "bronze",
      earned: 0,
      remainder: 0,
      target: 10,
      targetReachedAt: null,
      windowStart: state.bronze.windowStart,
      windowEnd: state.bronze.windowEnd,
    });
    expect(state.silver.earned).toBe(0);
    expect(state.gold.earned).toBe(0);
    expect(Number.isNaN(state.silver.earned)).toBe(false);
  });

  it("a 29-bronze day still only reaches target once (target, not a cap)", () => {
    const events: EngineStarEvent[] = Array.from({ length: 29 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, Math.floor(i / 2)), `e${i}`)
    );
    const now = local(2026, 7, 14, 20, 0);
    const state = computeState(events, config, now);
    expect(state.bronze.earned).toBe(29);
    expect(state.bronze.targetReachedAt).not.toBeNull();
  });

  it("a week spanning a month boundary computes silver from bronze across both months, gold stays per-month", () => {
    // Sun 2026-07-26 .. Sun 2026-08-02: 6/day for Jul 26-31 (36), 9 on Aug 1
    const events: EngineStarEvent[] = [];
    let counter = 0;
    for (let day = 26; day <= 31; day++) {
      for (let i = 0; i < 6; i++) {
        events.push(bronzeEvent("child1", 1, localIso(2026, 7, day, 8, i), `e${counter++}`));
      }
    }
    for (let i = 0; i < 9; i++) {
      events.push(bronzeEvent("child1", 1, localIso(2026, 8, 1, 8, i), `e${counter++}`));
    }

    const nowInWeek = local(2026, 8, 1, 20, 0);
    const state = computeState(events, config, nowInWeek);
    expect(state.silver.earned).toBe(15); // floor(45/3) = 15, target reached
    expect(state.silver.targetReachedAt).not.toBeNull();

    const julyState = computeState(events, config, local(2026, 7, 30, 12, 0));
    expect(julyState.gold.earned).toBe(1); // floor(floor(36/3)/10) = floor(12/10) = 1

    const augustState = computeState(events, config, local(2026, 8, 1, 20, 0));
    expect(augustState.gold.earned).toBe(0); // floor(floor(9/3)/10) = floor(3/10) = 0
  });
});

describe("computeGrants", () => {
  it("fires exactly one grant per window even with events well past target", () => {
    const events: EngineStarEvent[] = Array.from({ length: 29 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, Math.floor(i / 2)), `e${i}`)
    );
    const grants = computeGrants(events, config, local(2026, 7, 14, 20, 0));
    const bronzeGrants = grants.filter((g) => g.tierId === "bronze");
    expect(bronzeGrants).toHaveLength(1);
    expect(bronzeGrants[0].size).toBe("small");
  });

  it("returns [] for no events", () => {
    expect(computeGrants([], config, local(2026, 7, 14, 12, 0))).toEqual([]);
  });

  it("produces deterministic, stable ids across repeated calls", () => {
    const events: EngineStarEvent[] = Array.from({ length: 10 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 14, 8, i), `e${i}`)
    );
    const now = local(2026, 7, 14, 20, 0);
    const first = computeGrants(events, config, now);
    const second = computeGrants(events, config, now);
    expect(first.map((g) => g.id)).toEqual(second.map((g) => g.id));
    expect(first[0].id).toBe(`child1:bronze:${localIso(2026, 7, 14)}`);
  });

  it("keeps returning a grant from a past window that was never claimed", () => {
    const events: EngineStarEvent[] = Array.from({ length: 10 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 10, 8, i), `e${i}`)
    );
    const grants = computeGrants(events, config, local(2026, 7, 20, 12, 0));
    const grantForThatDay = grants.find((g) => g.tierId === "bronze" && g.windowStart === localIso(2026, 7, 10));
    expect(grantForThatDay).toBeDefined();
  });

  it("works for a hypothetical 4th tier with zero engine changes (chain-length agnostic)", () => {
    const extendedConfig: EconomyConfig = {
      ...config,
      tiers: [
        ...config.tiers,
        {
          id: "platinum",
          label: "פלטינה",
          icon: "💎",
          color: "#e5e4e2",
          source: { type: "convert", from: "gold", rate: 2 },
          window: "monthly",
          target: 1,
          reward: "large",
          consumesSource: false,
          rolloverRemainder: false,
          order: 3,
        },
      ],
    };

    // 2 gold's worth: 2 * (10 silver's worth) * (3 bronze each) = 60 bronze
    const events: EngineStarEvent[] = Array.from({ length: 60 }, (_, i) =>
      bronzeEvent("child1", 1, localIso(2026, 7, 1 + Math.floor(i / 10), 8, i % 10), `e${i}`)
    );
    const now = local(2026, 7, 20, 12, 0);
    const state = computeState(events, extendedConfig, now);
    expect(state.platinum.earned).toBe(Math.floor(state.gold.earned / 2));
  });
});
