// Mirror of src/economy/windows.ts — see types.ts in this folder for why.
import type { EconomyResets, TierConfig } from "./types.ts";

export interface Window {
  start: Date;
  end: Date;
}

function parseHHMM(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

// Constructing dates from local (year, month, day, hour, minute) components
// — rather than adding fixed millisecond offsets to a previous instant —
// keeps every boundary DST-safe: the JS engine resolves each construction to
// the correct UTC instant for that local wall-clock moment on its own, so a
// 23- or 25-hour local day is handled automatically.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function dailyWindow(now: Date, dailyAt: string): Window {
  const { h, m } = parseHHMM(dailyAt);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (now < start) {
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1, h, m, 0, 0);
  }
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, h, m, 0, 0);
  return { start, end };
}

export function weeklyWindow(now: Date, dailyAt: string, weekStartsOn: number): Window {
  const { start: dayAnchor } = dailyWindow(now, dailyAt);
  const { h, m } = parseHHMM(dailyAt);
  const back = (dayAnchor.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(dayAnchor.getFullYear(), dayAnchor.getMonth(), dayAnchor.getDate() - back, h, m, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, h, m, 0, 0);
  return { start, end };
}

export function monthlyWindow(now: Date, dailyAt: string, monthStartsOnDay: number): Window {
  const { h, m } = parseHHMM(dailyAt);
  const clampDay = (y: number, mo: number) => Math.min(monthStartsOnDay, daysInMonth(y, mo));
  const y = now.getFullYear();
  const mo = now.getMonth();
  let start = new Date(y, mo, clampDay(y, mo), h, m, 0, 0);
  if (now < start) {
    start = new Date(y, mo - 1, clampDay(y, mo - 1), h, m, 0, 0);
  }
  const endMo = start.getMonth() + 1;
  const end = new Date(start.getFullYear(), endMo, clampDay(start.getFullYear(), endMo), h, m, 0, 0);
  return { start, end };
}

export function getTierWindow(tier: TierConfig, now: Date, resets: EconomyResets): Window {
  switch (tier.window) {
    case "daily":
      return dailyWindow(now, resets.dailyAt);
    case "weekly":
      return weeklyWindow(now, resets.dailyAt, resets.weekStartsOn);
    case "monthly":
      return monthlyWindow(now, resets.dailyAt, resets.monthStartsOnDay);
  }
}
