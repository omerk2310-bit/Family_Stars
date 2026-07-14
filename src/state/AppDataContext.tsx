import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppSettings,
  Behavior,
  Child,
  Entity,
  HeartEvent,
  HeartEventType,
  LegacyGrant,
  RedEvent,
  RedEventType,
  Reward,
  RewardClaim,
  RewardDefinition,
  RewardRedemption,
  StarAdjustment,
  StarEvent,
} from "../types/entities";
import type { RewardGrant } from "../economy/types";
import { DEFAULT_ECONOMY_CONFIG } from "../economy/defaultConfig";
import { KEYS } from "../storage/keys";
import { supabase } from "../storage/supabaseClient";
import { TABLE_CONFIGS, settingsFromRow, settingsToRow, type TableConfig } from "../storage/tableMap";
import { archiveRow, getCollection, removeRow, upsertRow } from "../storage/remoteDb";
import { initializeStorage } from "../storage/seedInit";
import {
  applyImport,
  downloadExport,
  resetAllData as resetAllDataStorage,
  validateImport,
  type AppDataExport,
} from "../storage/exportImport";

initializeStorage();

const DEFAULT_SETTINGS: AppSettings = {
  dailyStarCap: 15,
  dailyHeartCap: 2,
  familyHeartTarget: 10,
  economyConfig: DEFAULT_ECONOMY_CONFIG,
  economyStartsAt: new Date(0).toISOString(),
  economyMigrationShown: false,
};

function useCollectionState<T extends Entity>(key: string) {
  const config = TABLE_CONFIGS[key] as unknown as TableConfig<T>;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCollection(config)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`realtime:${config.table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: config.table },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as Record<string, unknown>).id as string;
              return prev.filter((i) => i.id !== oldId);
            }
            const next = config.fromRow(payload.new as Record<string, unknown>);
            const idx = prev.findIndex((i) => i.id === next.id);
            if (idx === -1) return [...prev, next];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [key]);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
      upsertRow(config, item).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    },
    [key]
  );

  const update = useCallback(
    (item: T) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      upsertRow(config, item).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    },
    [key]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      removeRow(config.table, id).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    },
    [key]
  );

  const archive = useCallback(
    (id: string, archived = true) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, archived } : i)));
      archiveRow(config, id, archived).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    },
    [key]
  );

  const replaceAll = useCallback((next: T[]) => setItems(next), []);

  return { items, loading, error, add, update, remove, archive, replaceAll };
}

interface AppDataContextValue {
  loading: boolean;

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
  rewardClaims: RewardClaim[];
  legacyGrants: LegacyGrant[];
  rewardDefinitions: RewardDefinition[];
  settings: AppSettings;

  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  archiveChild: (id: string, archived?: boolean) => void;
  reorderChildren: (orderedIds: string[]) => void;

  addBehavior: (behavior: Behavior) => void;
  updateBehavior: (behavior: Behavior) => void;
  archiveBehavior: (id: string, archived?: boolean) => void;
  reorderBehaviors: (orderedIds: string[]) => void;

  addStarEvent: (event: StarEvent) => void;
  addStarAdjustment: (adjustment: StarAdjustment) => void;

  addHeartEventType: (type: HeartEventType) => void;
  updateHeartEventType: (type: HeartEventType) => void;
  archiveHeartEventType: (id: string, archived?: boolean) => void;
  addHeartEvent: (event: HeartEvent) => void;

  addRedEventType: (type: RedEventType) => void;
  updateRedEventType: (type: RedEventType) => void;
  archiveRedEventType: (id: string, archived?: boolean) => void;
  addRedEvent: (event: RedEvent) => void;
  linkRepairToRedEvent: (redEventId: string, starEventId: string) => void;

  addReward: (reward: Reward) => void;
  updateReward: (reward: Reward) => void;
  archiveReward: (id: string, archived?: boolean) => void;
  reorderRewards: (orderedIds: string[]) => void;
  addRewardRedemption: (redemption: RewardRedemption) => void;
  updateRewardRedemptionStatus: (id: string, status: RewardRedemption["status"]) => void;

  claimRewardGrant: (grant: RewardGrant) => void;
  claimLegacyGrant: (id: string) => void;
  addLegacyGrant: (grant: LegacyGrant) => void;

  addRewardDefinition: (definition: RewardDefinition) => void;
  updateRewardDefinition: (definition: RewardDefinition) => void;

  updateSettings: (settings: AppSettings) => void;

  exportData: () => void;
  importData: (json: unknown) => { valid: boolean; errors: string[]; warnings: string[] };
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children: reactChildren }: { children: ReactNode }) {
  const childrenState = useCollectionState<Child>(KEYS.children);
  const behaviorsState = useCollectionState<Behavior>(KEYS.behaviors);
  const starEventsState = useCollectionState<StarEvent>(KEYS.starEvents);
  const starAdjustmentsState = useCollectionState<StarAdjustment>(KEYS.starAdjustments);
  const heartEventTypesState = useCollectionState<HeartEventType>(KEYS.heartEventTypes);
  const heartEventsState = useCollectionState<HeartEvent>(KEYS.heartEvents);
  const redEventTypesState = useCollectionState<RedEventType>(KEYS.redEventTypes);
  const redEventsState = useCollectionState<RedEvent>(KEYS.redEvents);
  const rewardsState = useCollectionState<Reward>(KEYS.rewards);
  const rewardRedemptionsState = useCollectionState<RewardRedemption>(KEYS.rewardRedemptions);
  const rewardClaimsState = useCollectionState<RewardClaim>(KEYS.rewardClaims);
  const legacyGrantsState = useCollectionState<LegacyGrant>(KEYS.legacyGrants);
  const rewardDefinitionsState = useCollectionState<RewardDefinition>(KEYS.rewardDefinitions);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("app_settings")
      .select("*")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setSettings(settingsFromRow(data));
        setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reorderChildren = useCallback(
    (orderedIds: string[]) => {
      const orderById = new Map(orderedIds.map((id, index) => [id, index]));
      const next = childrenState.items.map((c) =>
        orderById.has(c.id) ? { ...c, order: orderById.get(c.id)! } : c
      );
      childrenState.replaceAll(next);
      next
        .filter((c) => orderById.has(c.id))
        .forEach((c) => {
          upsertRow(TABLE_CONFIGS[KEYS.children] as unknown as TableConfig<Child>, c).catch(() => undefined);
        });
    },
    [childrenState]
  );

  const reorderRewards = useCallback(
    (orderedIds: string[]) => {
      const orderById = new Map(orderedIds.map((id, index) => [id, index]));
      const next = rewardsState.items.map((r) =>
        orderById.has(r.id) ? { ...r, order: orderById.get(r.id)! } : r
      );
      rewardsState.replaceAll(next);
      next
        .filter((r) => orderById.has(r.id))
        .forEach((r) => {
          upsertRow(TABLE_CONFIGS[KEYS.rewards] as unknown as TableConfig<Reward>, r).catch(() => undefined);
        });
    },
    [rewardsState]
  );

  const reorderBehaviors = useCallback(
    (orderedIds: string[]) => {
      const orderById = new Map(orderedIds.map((id, index) => [id, index]));
      const next = behaviorsState.items.map((b) =>
        orderById.has(b.id) ? { ...b, order: orderById.get(b.id)! } : b
      );
      behaviorsState.replaceAll(next);
      next
        .filter((b) => orderById.has(b.id))
        .forEach((b) => {
          upsertRow(TABLE_CONFIGS[KEYS.behaviors] as unknown as TableConfig<Behavior>, b).catch(() => undefined);
        });
    },
    [behaviorsState]
  );

  const linkRepairToRedEvent = useCallback(
    (redEventId: string, starEventId: string) => {
      const event = redEventsState.items.find((e) => e.id === redEventId);
      if (!event) return;
      redEventsState.update({ ...event, wasRepaired: true, repairStarEventId: starEventId });
    },
    [redEventsState]
  );

  const updateRewardRedemptionStatus = useCallback(
    (id: string, status: RewardRedemption["status"]) => {
      const redemption = rewardRedemptionsState.items.find((r) => r.id === id);
      if (!redemption) return;
      rewardRedemptionsState.update({ ...redemption, status });
    },
    [rewardRedemptionsState]
  );

  // computeGrants() (src/economy/engine.ts) always returns claimedAt: null —
  // it's pure and derived purely from StarEvent history. Marking a grant
  // delivered just writes one row into reward_claims, keyed by the grant's
  // own deterministic id; a redundant tap (or a race between two devices)
  // is harmless since we skip writing if a claim already exists.
  const claimRewardGrant = useCallback(
    (grant: RewardGrant) => {
      if (rewardClaimsState.items.some((c) => c.id === grant.id)) return;
      rewardClaimsState.add({
        id: grant.id,
        childId: grant.childId,
        tierId: grant.tierId,
        windowStart: grant.windowStart,
        claimedAt: new Date().toISOString(),
      });
    },
    [rewardClaimsState]
  );

  const claimLegacyGrant = useCallback(
    (id: string) => {
      const grant = legacyGrantsState.items.find((g) => g.id === id);
      if (!grant) return;
      legacyGrantsState.update({ ...grant, claimedAt: new Date().toISOString() });
    },
    [legacyGrantsState]
  );

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    supabase
      .from("app_settings")
      .upsert(settingsToRow(next), { onConflict: "user_id" })
      .then(() => undefined);
  }, []);

  // exportData/importData/resetAllData still operate on the legacy localStorage
  // snapshot (not the live Supabase-backed data shown on screen) until Phase F
  // repoints them at Supabase — buildExport()/applyImport() are reused as-is
  // there as the migration payload shape.
  const exportData = useCallback(() => downloadExport(), []);

  const importData = useCallback((json: unknown) => {
    const result = validateImport(json);
    if (result.valid) applyImport(json as AppDataExport);
    return result;
  }, []);

  const resetAllData = useCallback(() => {
    resetAllDataStorage();
    initializeStorage();
  }, []);

  const loading =
    childrenState.loading ||
    behaviorsState.loading ||
    starEventsState.loading ||
    starAdjustmentsState.loading ||
    heartEventTypesState.loading ||
    heartEventsState.loading ||
    redEventTypesState.loading ||
    redEventsState.loading ||
    rewardsState.loading ||
    rewardRedemptionsState.loading ||
    rewardClaimsState.loading ||
    legacyGrantsState.loading ||
    rewardDefinitionsState.loading ||
    settingsLoading;

  const value = useMemo<AppDataContextValue>(
    () => ({
      loading,

      children: childrenState.items,
      behaviors: behaviorsState.items,
      starEvents: starEventsState.items,
      starAdjustments: starAdjustmentsState.items,
      heartEventTypes: heartEventTypesState.items,
      heartEvents: heartEventsState.items,
      redEventTypes: redEventTypesState.items,
      redEvents: redEventsState.items,
      rewards: rewardsState.items,
      rewardRedemptions: rewardRedemptionsState.items,
      rewardClaims: rewardClaimsState.items,
      legacyGrants: legacyGrantsState.items,
      rewardDefinitions: rewardDefinitionsState.items,
      settings,

      addChild: childrenState.add,
      updateChild: childrenState.update,
      archiveChild: childrenState.archive,
      reorderChildren,

      addBehavior: behaviorsState.add,
      updateBehavior: behaviorsState.update,
      archiveBehavior: behaviorsState.archive,
      reorderBehaviors,

      addStarEvent: starEventsState.add,
      addStarAdjustment: starAdjustmentsState.add,

      addHeartEventType: heartEventTypesState.add,
      updateHeartEventType: heartEventTypesState.update,
      archiveHeartEventType: heartEventTypesState.archive,
      addHeartEvent: heartEventsState.add,

      addRedEventType: redEventTypesState.add,
      updateRedEventType: redEventTypesState.update,
      archiveRedEventType: redEventTypesState.archive,
      addRedEvent: redEventsState.add,
      linkRepairToRedEvent,

      addReward: rewardsState.add,
      updateReward: rewardsState.update,
      archiveReward: rewardsState.archive,
      reorderRewards,
      addRewardRedemption: rewardRedemptionsState.add,
      updateRewardRedemptionStatus,

      claimRewardGrant,
      claimLegacyGrant,
      addLegacyGrant: legacyGrantsState.add,

      addRewardDefinition: rewardDefinitionsState.add,
      updateRewardDefinition: rewardDefinitionsState.update,

      updateSettings,

      exportData,
      importData,
      resetAllData,
    }),
    [
      loading,
      childrenState,
      behaviorsState,
      starEventsState,
      starAdjustmentsState,
      heartEventTypesState,
      heartEventsState,
      redEventTypesState,
      redEventsState,
      rewardsState,
      rewardRedemptionsState,
      rewardClaimsState,
      legacyGrantsState,
      rewardDefinitionsState,
      settings,
      reorderChildren,
      reorderRewards,
      reorderBehaviors,
      linkRepairToRedEvent,
      updateRewardRedemptionStatus,
      claimRewardGrant,
      claimLegacyGrant,
      updateSettings,
      exportData,
      importData,
      resetAllData,
    ]
  );

  return <AppDataContext.Provider value={value}>{reactChildren}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export type { AppDataExport };
