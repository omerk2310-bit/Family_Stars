export interface Child {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
  archived?: boolean;
}

export interface Behavior {
  id: string;
  childId: string;
  title: string;
  description: string;
  points: number;
  category: string;
  isBonus: boolean;
  minPoints?: number;
  maxPoints?: number;
  archived?: boolean;
  order: number;
  isGoldStar?: boolean;
}

export interface StarEvent {
  id: string;
  childId: string;
  behaviorId: string;
  pointsAwarded: number;
  note?: string;
  createdAt: string;
  isGoldStar: boolean;
}

export interface StarAdjustment {
  id: string;
  childId: string;
  delta: number;
  note?: string;
  createdAt: string;
  isGoldStar?: boolean;
}

export interface HeartEventType {
  id: string;
  title: string;
  description: string;
  hearts: number;
  archived?: boolean;
}

export interface HeartEvent {
  id: string;
  heartEventTypeId: string;
  heartsAwarded: number;
  note?: string;
  createdAt: string;
}

export interface RedEventType {
  id: string;
  childId?: string;
  label: string;
  archived?: boolean;
}

export interface RedEvent {
  id: string;
  childId?: string;
  redEventTypeId: string;
  note?: string;
  createdAt: string;
  wasRepaired: boolean;
  repairStarEventId?: string;
}

export type RewardType = "small" | "medium" | "family";

export interface Reward {
  id: string;
  title: string;
  cost: number;
  type: RewardType;
  description?: string;
  requiresParentApproval: boolean;
  archived?: boolean;
  order: number;
  isGoldStar?: boolean;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  childId?: string;
  createdAt: string;
}

export interface AppSettings {
  dailyStarCap: number;
  dailyHeartCap: number;
  familyHeartTarget: number;
  adminPin?: string;
}

export interface Entity {
  id: string;
}
