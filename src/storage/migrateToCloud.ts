import { buildExport } from "./exportImport";
import { bulkUpsert } from "./remoteDb";
import { supabase } from "./supabaseClient";
import { TABLE_CONFIGS, settingsToRow, type TableConfig } from "./tableMap";
import { KEYS } from "./keys";
import type {
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

function config<T extends Entity>(key: string): TableConfig<T> {
  return TABLE_CONFIGS[key] as unknown as TableConfig<T>;
}

export async function alreadyMigrated(): Promise<boolean> {
  const { count, error } = await supabase.from("children").select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function migrateLocalDataToCloud(): Promise<void> {
  const { data } = buildExport();

  await bulkUpsert(config<Child>(KEYS.children), data.children);
  await bulkUpsert(config<Behavior>(KEYS.behaviors), data.behaviors);
  await bulkUpsert(config<StarEvent>(KEYS.starEvents), data.starEvents);
  await bulkUpsert(config<StarAdjustment>(KEYS.starAdjustments), data.starAdjustments);
  await bulkUpsert(config<HeartEventType>(KEYS.heartEventTypes), data.heartEventTypes);
  await bulkUpsert(config<HeartEvent>(KEYS.heartEvents), data.heartEvents);
  await bulkUpsert(config<RedEventType>(KEYS.redEventTypes), data.redEventTypes);
  await bulkUpsert(config<RedEvent>(KEYS.redEvents), data.redEvents);
  await bulkUpsert(config<Reward>(KEYS.rewards), data.rewards);
  await bulkUpsert(config<RewardRedemption>(KEYS.rewardRedemptions), data.rewardRedemptions);

  const { error } = await supabase
    .from("app_settings")
    .upsert(settingsToRow(data.settings), { onConflict: "user_id" });
  if (error) throw error;
}
