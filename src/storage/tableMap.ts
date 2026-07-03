import type {
  AppSettings,
  Behavior,
  Child,
  Entity,
  HeartEvent,
  HeartEventType,
  RedEvent,
  RedEventType,
  Reward,
  RewardRedemption,
  StarAdjustment,
  StarEvent,
} from "../types/entities";
import { KEYS } from "./keys";

export interface TableConfig<T extends Entity> {
  table: string;
  toRow: (item: T) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => T;
}

const childConfig: TableConfig<Child> = {
  table: "children",
  toRow: (c) => ({
    id: c.id,
    name: c.name,
    display_name: c.displayName,
    color: c.color,
    icon: c.icon,
    sort_order: c.order,
    created_at: c.createdAt,
    archived: c.archived ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    name: r.name as string,
    displayName: r.display_name as string,
    color: r.color as string,
    icon: r.icon as string,
    order: r.sort_order as number,
    createdAt: r.created_at as string,
    archived: (r.archived as boolean) ?? undefined,
  }),
};

const behaviorConfig: TableConfig<Behavior> = {
  table: "behaviors",
  toRow: (b) => ({
    id: b.id,
    child_id: b.childId,
    title: b.title,
    description: b.description,
    points: b.points,
    category: b.category,
    is_bonus: b.isBonus,
    min_points: b.minPoints ?? null,
    max_points: b.maxPoints ?? null,
    archived: b.archived ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    childId: r.child_id as string,
    title: r.title as string,
    description: r.description as string,
    points: r.points as number,
    category: r.category as string,
    isBonus: r.is_bonus as boolean,
    minPoints: (r.min_points as number | null) ?? undefined,
    maxPoints: (r.max_points as number | null) ?? undefined,
    archived: (r.archived as boolean) ?? undefined,
  }),
};

const starEventConfig: TableConfig<StarEvent> = {
  table: "star_events",
  toRow: (e) => ({
    id: e.id,
    child_id: e.childId,
    behavior_id: e.behaviorId,
    points_awarded: e.pointsAwarded,
    note: e.note ?? null,
    created_at: e.createdAt,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    childId: r.child_id as string,
    behaviorId: r.behavior_id as string,
    pointsAwarded: r.points_awarded as number,
    note: (r.note as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }),
};

const starAdjustmentConfig: TableConfig<StarAdjustment> = {
  table: "star_adjustments",
  toRow: (a) => ({
    id: a.id,
    child_id: a.childId,
    delta: a.delta,
    note: a.note ?? null,
    created_at: a.createdAt,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    childId: r.child_id as string,
    delta: r.delta as number,
    note: (r.note as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }),
};

const heartEventTypeConfig: TableConfig<HeartEventType> = {
  table: "heart_event_types",
  toRow: (t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    hearts: t.hearts,
    archived: t.archived ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    hearts: r.hearts as number,
    archived: (r.archived as boolean) ?? undefined,
  }),
};

const heartEventConfig: TableConfig<HeartEvent> = {
  table: "heart_events",
  toRow: (e) => ({
    id: e.id,
    heart_event_type_id: e.heartEventTypeId,
    hearts_awarded: e.heartsAwarded,
    note: e.note ?? null,
    created_at: e.createdAt,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    heartEventTypeId: r.heart_event_type_id as string,
    heartsAwarded: r.hearts_awarded as number,
    note: (r.note as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }),
};

const redEventTypeConfig: TableConfig<RedEventType> = {
  table: "red_event_types",
  toRow: (t) => ({
    id: t.id,
    child_id: t.childId ?? null,
    label: t.label,
    archived: t.archived ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    childId: (r.child_id as string | null) ?? undefined,
    label: r.label as string,
    archived: (r.archived as boolean) ?? undefined,
  }),
};

const redEventConfig: TableConfig<RedEvent> = {
  table: "red_events",
  toRow: (e) => ({
    id: e.id,
    child_id: e.childId ?? null,
    red_event_type_id: e.redEventTypeId,
    note: e.note ?? null,
    created_at: e.createdAt,
    was_repaired: e.wasRepaired,
    repair_star_event_id: e.repairStarEventId ?? null,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    childId: (r.child_id as string | null) ?? undefined,
    redEventTypeId: r.red_event_type_id as string,
    note: (r.note as string | null) ?? undefined,
    createdAt: r.created_at as string,
    wasRepaired: r.was_repaired as boolean,
    repairStarEventId: (r.repair_star_event_id as string | null) ?? undefined,
  }),
};

const rewardConfig: TableConfig<Reward> = {
  table: "rewards",
  toRow: (r) => ({
    id: r.id,
    title: r.title,
    cost: r.cost,
    type: r.type,
    description: r.description ?? null,
    requires_parent_approval: r.requiresParentApproval,
    archived: r.archived ?? false,
    sort_order: r.order,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    title: r.title as string,
    cost: r.cost as number,
    type: r.type as Reward["type"],
    description: (r.description as string | null) ?? undefined,
    requiresParentApproval: r.requires_parent_approval as boolean,
    archived: (r.archived as boolean) ?? undefined,
    order: r.sort_order as number,
  }),
};

const rewardRedemptionConfig: TableConfig<RewardRedemption> = {
  table: "reward_redemptions",
  toRow: (r) => ({
    id: r.id,
    reward_id: r.rewardId,
    child_id: r.childId ?? null,
    created_at: r.createdAt,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    rewardId: r.reward_id as string,
    childId: (r.child_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }),
};

// Each config's toRow/fromRow is only ever invoked with its own entity type
// (looked up by the matching KEYS.* string), so the variance TS flags here is
// not reachable in practice — cast through `unknown` to store them uniformly.
export const TABLE_CONFIGS: Record<string, TableConfig<Entity>> = {
  [KEYS.children]: childConfig as unknown as TableConfig<Entity>,
  [KEYS.behaviors]: behaviorConfig as unknown as TableConfig<Entity>,
  [KEYS.starEvents]: starEventConfig as unknown as TableConfig<Entity>,
  [KEYS.starAdjustments]: starAdjustmentConfig as unknown as TableConfig<Entity>,
  [KEYS.heartEventTypes]: heartEventTypeConfig as unknown as TableConfig<Entity>,
  [KEYS.heartEvents]: heartEventConfig as unknown as TableConfig<Entity>,
  [KEYS.redEventTypes]: redEventTypeConfig as unknown as TableConfig<Entity>,
  [KEYS.redEvents]: redEventConfig as unknown as TableConfig<Entity>,
  [KEYS.rewards]: rewardConfig as unknown as TableConfig<Entity>,
  [KEYS.rewardRedemptions]: rewardRedemptionConfig as unknown as TableConfig<Entity>,
};

export function settingsToRow(s: AppSettings): Record<string, unknown> {
  return {
    daily_star_cap: s.dailyStarCap,
    daily_heart_cap: s.dailyHeartCap,
    family_heart_target: s.familyHeartTarget,
    admin_pin: s.adminPin ?? null,
  };
}

export function settingsFromRow(r: Record<string, unknown>): AppSettings {
  return {
    dailyStarCap: r.daily_star_cap as number,
    dailyHeartCap: r.daily_heart_cap as number,
    familyHeartTarget: r.family_heart_target as number,
    adminPin: (r.admin_pin as string | null) ?? undefined,
  };
}
