import type {
  Behavior,
  Child,
  HeartEvent,
  HeartEventType,
  RedEvent,
  RedEventType,
  Reward,
  RewardRedemption,
  StarAdjustment,
  StarEvent,
} from "../types/entities";
import { getWeekRange, isSameLocalDay, isWithinRange } from "../utils/dateRange";

const REMOVED_BEHAVIOR_FALLBACK = "התנהגות שהוסרה";
const REMOVED_RED_TYPE_FALLBACK = "סוג אירוע שהוסר";
const REMOVED_HEART_TYPE_FALLBACK = "סוג אירוע שהוסר";
const REMOVED_REWARD_FALLBACK = "פרס שהוסר";
const REMOVED_CHILD_FALLBACK = "ילדה שהוסרה";

export function getTodayStarsForChild(childId: string, starEvents: StarEvent[], today: Date): number {
  return starEvents
    .filter((e) => e.childId === childId && isSameLocalDay(e.createdAt, today))
    .reduce((sum, e) => sum + e.pointsAwarded, 0);
}

export function getLifetimeXpForChild(
  childId: string,
  starEvents: StarEvent[],
  starAdjustments: StarAdjustment[]
): number {
  const fromEvents = starEvents.filter((e) => e.childId === childId).reduce((sum, e) => sum + e.pointsAwarded, 0);
  const fromAdjustments = starAdjustments
    .filter((a) => a.childId === childId)
    .reduce((sum, a) => sum + a.delta, 0);
  return fromEvents + fromAdjustments;
}

export function getAvailableStarsForChild(
  childId: string,
  starEvents: StarEvent[],
  starAdjustments: StarAdjustment[],
  rewardRedemptions: RewardRedemption[],
  rewards: Reward[]
): number {
  const earned = getLifetimeXpForChild(childId, starEvents, starAdjustments);
  const spent = rewardRedemptions
    .filter((r) => r.childId === childId)
    .reduce((sum, r) => {
      const reward = rewards.find((rw) => rw.id === r.rewardId);
      if (!reward || reward.type === "family") return sum;
      return sum + reward.cost;
    }, 0);
  return Math.max(0, earned - spent);
}

export function getTodayHeartsTotal(heartEvents: HeartEvent[], today: Date): number {
  return heartEvents
    .filter((e) => isSameLocalDay(e.createdAt, today))
    .reduce((sum, e) => sum + e.heartsAwarded, 0);
}

export function getFamilyHeartsCurrent(
  heartEvents: HeartEvent[],
  rewardRedemptions: RewardRedemption[],
  rewards: Reward[]
): number {
  const earned = heartEvents.reduce((sum, e) => sum + e.heartsAwarded, 0);
  const spent = rewardRedemptions
    .filter((r) => !r.childId)
    .reduce((sum, r) => {
      const reward = rewards.find((rw) => rw.id === r.rewardId);
      if (!reward || reward.type !== "family") return sum;
      return sum + reward.cost;
    }, 0);
  return Math.max(0, earned - spent);
}

export function getThisWeekEventsForChild(childId: string, starEvents: StarEvent[], reference: Date): StarEvent[] {
  const { start, end } = getWeekRange(reference);
  return starEvents.filter((e) => e.childId === childId && isWithinRange(e.createdAt, start, end));
}

export function getThisWeekHeartEvents(heartEvents: HeartEvent[], reference: Date): HeartEvent[] {
  const { start, end } = getWeekRange(reference);
  return heartEvents.filter((e) => isWithinRange(e.createdAt, start, end));
}

export interface TopBehaviorEntry {
  behaviorId: string;
  title: string;
  category: string;
  count: number;
  totalPoints: number;
}

export function getTopBehaviorsThisWeek(
  childId: string,
  starEvents: StarEvent[],
  behaviors: Behavior[],
  reference: Date,
  n = 3
): TopBehaviorEntry[] {
  const weekEvents = getThisWeekEventsForChild(childId, starEvents, reference);
  const tally = new Map<string, TopBehaviorEntry>();

  for (const event of weekEvents) {
    const behavior = behaviors.find((b) => b.id === event.behaviorId);
    if (!behavior || behavior.isBonus) continue;
    const existing = tally.get(behavior.id);
    if (existing) {
      existing.count += 1;
      existing.totalPoints += event.pointsAwarded;
    } else {
      tally.set(behavior.id, {
        behaviorId: behavior.id,
        title: behavior.title,
        category: behavior.category,
        count: 1,
        totalPoints: event.pointsAwarded,
      });
    }
  }

  return Array.from(tally.values())
    .sort((a, b) => b.count - a.count || b.totalPoints - a.totalPoints)
    .slice(0, n);
}

export function resolveBehaviorName(behaviorId: string, behaviors: Behavior[]): string {
  return behaviors.find((b) => b.id === behaviorId)?.title ?? REMOVED_BEHAVIOR_FALLBACK;
}

export function resolveRedEventTypeLabel(typeId: string, types: RedEventType[]): string {
  return types.find((t) => t.id === typeId)?.label ?? REMOVED_RED_TYPE_FALLBACK;
}

export function resolveHeartEventTypeTitle(typeId: string, types: HeartEventType[]): string {
  return types.find((t) => t.id === typeId)?.title ?? REMOVED_HEART_TYPE_FALLBACK;
}

export function resolveRewardTitle(rewardId: string, rewards: Reward[]): string {
  return rewards.find((r) => r.id === rewardId)?.title ?? REMOVED_REWARD_FALLBACK;
}

export function resolveChildName(childId: string | undefined, children: Child[]): string {
  if (!childId) return "";
  return children.find((c) => c.id === childId)?.displayName ?? REMOVED_CHILD_FALLBACK;
}

export function getActiveChildren(children: Child[]): Child[] {
  return children.filter((c) => !c.archived).sort((a, b) => a.order - b.order);
}

export function getActiveBehaviorsForChild(childId: string, behaviors: Behavior[]): Behavior[] {
  return behaviors.filter((b) => b.childId === childId && !b.archived);
}

const TIME_OF_DAY_BUCKETS: { label: string; startHour: number; endHour: number }[] = [
  { label: "בוקר", startHour: 5, endHour: 12 },
  { label: "צהריים", startHour: 12, endHour: 17 },
  { label: "ערב", startHour: 17, endHour: 21 },
  { label: "לילה", startHour: 21, endHour: 5 },
];

function bucketForHour(hour: number): string {
  const bucket = TIME_OF_DAY_BUCKETS.find((b) =>
    b.startHour < b.endHour ? hour >= b.startHour && hour < b.endHour : hour >= b.startHour || hour < b.endHour
  );
  return bucket?.label ?? "לא ידוע";
}

export interface RedEventInsights {
  totalCount: number;
  repairCount: number;
  topTypes: { label: string; count: number }[];
  byTimeOfDay: { label: string; count: number }[];
}

export function getRedEventInsights(redEvents: RedEvent[], redEventTypes: RedEventType[]): RedEventInsights {
  const typeCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();
  let repairCount = 0;

  for (const event of redEvents) {
    const label = resolveRedEventTypeLabel(event.redEventTypeId, redEventTypes);
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);

    const hour = new Date(event.createdAt).getHours();
    const bucket = bucketForHour(hour);
    timeCounts.set(bucket, (timeCounts.get(bucket) ?? 0) + 1);

    if (event.wasRepaired) repairCount += 1;
  }

  const topTypes = Array.from(typeCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const byTimeOfDay = TIME_OF_DAY_BUCKETS.map((b) => ({ label: b.label, count: timeCounts.get(b.label) ?? 0 }));

  return { totalCount: redEvents.length, repairCount, topTypes, byTimeOfDay };
}
