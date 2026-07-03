import { KEYS, SCHEMA_VERSION } from "./keys";
import { getCollection, saveCollection } from "./db";
import type {
  AppSettings,
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

export interface AppDataExport {
  schemaVersion: number;
  exportedAt: string;
  data: {
    children: Child[];
    behaviors: Behavior[];
    starEvents: StarEvent[];
    starAdjustments: StarAdjustment[];
    heartEventTypes: HeartEventType[];
    heartEvents: HeartEvent[];
    redEventTypes: RedEventType[];
    redEvents: RedEvent[];
    rewards: Reward[];
    rewardRedemptions: RewardRedemption[];
    settings: AppSettings;
  };
}

export function buildExport(): AppDataExport {
  const settingsRaw = localStorage.getItem(KEYS.settings);
  const settings: AppSettings = settingsRaw
    ? JSON.parse(settingsRaw)
    : { dailyStarCap: 15, dailyHeartCap: 2, familyHeartTarget: 10 };

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      children: getCollection<Child>(KEYS.children),
      behaviors: getCollection<Behavior>(KEYS.behaviors),
      starEvents: getCollection<StarEvent>(KEYS.starEvents),
      starAdjustments: getCollection<StarAdjustment>(KEYS.starAdjustments),
      heartEventTypes: getCollection<HeartEventType>(KEYS.heartEventTypes),
      heartEvents: getCollection<HeartEvent>(KEYS.heartEvents),
      redEventTypes: getCollection<RedEventType>(KEYS.redEventTypes),
      redEvents: getCollection<RedEvent>(KEYS.redEvents),
      rewards: getCollection<Reward>(KEYS.rewards),
      rewardRedemptions: getCollection<RewardRedemption>(KEYS.rewardRedemptions),
      settings,
    },
  };
}

export function downloadExport(): void {
  const payload = buildExport();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kochot-habait-backup-${dateStamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const REQUIRED_COLLECTION_KEYS = [
  "children",
  "behaviors",
  "starEvents",
  "starAdjustments",
  "heartEventTypes",
  "heartEvents",
  "redEventTypes",
  "redEvents",
  "rewards",
  "rewardRedemptions",
] as const;

const REQUIRED_FIELDS: Record<(typeof REQUIRED_COLLECTION_KEYS)[number], string[]> = {
  children: ["id", "name", "displayName", "color", "icon", "order", "createdAt"],
  behaviors: ["id", "childId", "title", "points", "category", "isBonus"],
  starEvents: ["id", "childId", "behaviorId", "pointsAwarded", "createdAt"],
  starAdjustments: ["id", "childId", "delta", "createdAt"],
  heartEventTypes: ["id", "title", "hearts"],
  heartEvents: ["id", "heartEventTypeId", "heartsAwarded", "createdAt"],
  redEventTypes: ["id", "label"],
  redEvents: ["id", "redEventTypeId", "createdAt", "wasRepaired"],
  rewards: ["id", "title", "cost", "type"],
  rewardRedemptions: ["id", "rewardId", "createdAt"],
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateImport(json: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof json !== "object" || json === null) {
    return { valid: false, errors: ["הקובץ אינו JSON תקין."], warnings };
  }

  const parsed = json as Partial<AppDataExport>;
  if (typeof parsed.data !== "object" || parsed.data === null) {
    return { valid: false, errors: ["חסר שדה 'data' בקובץ."], warnings };
  }

  const data = parsed.data as Record<string, unknown>;

  for (const key of REQUIRED_COLLECTION_KEYS) {
    const collection = data[key];
    if (!Array.isArray(collection)) {
      errors.push(`השדה '${key}' חייב להיות רשימה.`);
      continue;
    }
    collection.forEach((item, idx) => {
      if (typeof item !== "object" || item === null) {
        errors.push(`פריט לא תקין ב-'${key}' (אינדקס ${idx}).`);
        return;
      }
      const requiredFields = REQUIRED_FIELDS[key];
      for (const field of requiredFields) {
        if (!(field in (item as Record<string, unknown>))) {
          errors.push(`פריט ב-'${key}' (אינדקס ${idx}) חסר שדה '${field}'.`);
        }
      }
    });
  }

  if (typeof data.settings !== "object" || data.settings === null) {
    errors.push("חסרות הגדרות (settings).");
  } else {
    const settings = data.settings as Record<string, unknown>;
    for (const field of ["dailyStarCap", "dailyHeartCap", "familyHeartTarget"]) {
      if (typeof settings[field] !== "number") {
        errors.push(`הגדרה '${field}' חסרה או אינה מספר.`);
      }
    }
  }

  if (errors.length === 0) {
    const children = data.children as Child[];
    const childIds = new Set(children.map((c) => c.id));
    const starEvents = data.starEvents as StarEvent[];
    for (const event of starEvents) {
      if (!childIds.has(event.childId)) {
        warnings.push(`אירוע כוכבים מפנה לילדה שלא קיימת (${event.childId}).`);
      }
    }
  }

  if (typeof parsed.schemaVersion === "number" && parsed.schemaVersion > SCHEMA_VERSION) {
    warnings.push("הקובץ נוצר בגרסה חדשה יותר של האפליקציה — ייתכן שחלק מהנתונים לא ייטענו כראוי.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function applyImport(json: AppDataExport): void {
  const { data } = json;
  saveCollection(KEYS.children, data.children);
  saveCollection(KEYS.behaviors, data.behaviors);
  saveCollection(KEYS.starEvents, data.starEvents);
  saveCollection(KEYS.starAdjustments, data.starAdjustments);
  saveCollection(KEYS.heartEventTypes, data.heartEventTypes);
  saveCollection(KEYS.heartEvents, data.heartEvents);
  saveCollection(KEYS.redEventTypes, data.redEventTypes);
  saveCollection(KEYS.redEvents, data.redEvents);
  saveCollection(KEYS.rewards, data.rewards);
  saveCollection(KEYS.rewardRedemptions, data.rewardRedemptions);
  localStorage.setItem(KEYS.settings, JSON.stringify(data.settings));
}

export function resetAllData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
