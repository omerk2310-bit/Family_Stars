import { KEYS, SCHEMA_VERSION } from "./keys";
import {
  seedBehaviors,
  seedChildren,
  seedHeartEventTypes,
  seedRedEventTypes,
  seedRewards,
  seedSettings,
} from "../seed/seedData";

function seedIfEmpty(key: string, value: unknown): void {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function initializeStorage(): void {
  seedIfEmpty(KEYS.children, seedChildren);
  seedIfEmpty(KEYS.behaviors, seedBehaviors);
  seedIfEmpty(KEYS.starEvents, []);
  seedIfEmpty(KEYS.heartEventTypes, seedHeartEventTypes);
  seedIfEmpty(KEYS.heartEvents, []);
  seedIfEmpty(KEYS.redEventTypes, seedRedEventTypes);
  seedIfEmpty(KEYS.redEvents, []);
  seedIfEmpty(KEYS.rewards, seedRewards);
  seedIfEmpty(KEYS.rewardRedemptions, []);
  seedIfEmpty(KEYS.settings, seedSettings);
  if (localStorage.getItem(KEYS.schemaVersion) === null) {
    localStorage.setItem(KEYS.schemaVersion, JSON.stringify(SCHEMA_VERSION));
  }
}
