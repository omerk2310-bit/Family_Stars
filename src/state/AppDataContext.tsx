import {
  createContext,
  useCallback,
  useContext,
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
  RedEvent,
  RedEventType,
  Reward,
  RewardRedemption,
  StarEvent,
} from "../types/entities";
import { KEYS } from "../storage/keys";
import { archiveEntity, getById, getCollection, removeEntity, upsert } from "../storage/db";
import { initializeStorage } from "../storage/seedInit";
import {
  applyImport,
  downloadExport,
  resetAllData as resetAllDataStorage,
  validateImport,
  type AppDataExport,
} from "../storage/exportImport";

initializeStorage();

function useCollectionState<T extends Entity>(key: string) {
  const [items, setItems] = useState<T[]>(() => getCollection<T>(key));

  const add = useCallback((item: T) => setItems(upsert(key, item)), [key]);
  const update = useCallback((item: T) => setItems(upsert(key, item)), [key]);
  const remove = useCallback((id: string) => setItems(removeEntity<T>(key, id)), [key]);
  const archive = useCallback(
    (id: string, archived = true) => setItems(archiveEntity<T>(key, id, archived)),
    [key]
  );
  const replaceAll = useCallback((next: T[]) => setItems(next), []);

  return { items, add, update, remove, archive, replaceAll };
}

function readSettings(): AppSettings {
  const raw = localStorage.getItem(KEYS.settings);
  return raw ? JSON.parse(raw) : { dailyStarCap: 15, dailyHeartCap: 2, familyHeartTarget: 10 };
}

interface AppDataContextValue {
  children: Child[];
  behaviors: Behavior[];
  starEvents: StarEvent[];
  heartEventTypes: HeartEventType[];
  heartEvents: HeartEvent[];
  redEventTypes: RedEventType[];
  redEvents: RedEvent[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  settings: AppSettings;

  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  archiveChild: (id: string, archived?: boolean) => void;
  reorderChildren: (orderedIds: string[]) => void;

  addBehavior: (behavior: Behavior) => void;
  updateBehavior: (behavior: Behavior) => void;
  archiveBehavior: (id: string, archived?: boolean) => void;

  addStarEvent: (event: StarEvent) => void;

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
  const heartEventTypesState = useCollectionState<HeartEventType>(KEYS.heartEventTypes);
  const heartEventsState = useCollectionState<HeartEvent>(KEYS.heartEvents);
  const redEventTypesState = useCollectionState<RedEventType>(KEYS.redEventTypes);
  const redEventsState = useCollectionState<RedEvent>(KEYS.redEvents);
  const rewardsState = useCollectionState<Reward>(KEYS.rewards);
  const rewardRedemptionsState = useCollectionState<RewardRedemption>(KEYS.rewardRedemptions);
  const [settings, setSettings] = useState<AppSettings>(readSettings);

  const reorderChildren = useCallback(
    (orderedIds: string[]) => {
      const reordered = orderedIds
        .map((id, index) => {
          const child = getById<Child>(KEYS.children, id);
          return child ? { ...child, order: index } : undefined;
        })
        .filter((c): c is Child => Boolean(c));
      reordered.forEach((c) => upsert(KEYS.children, c));
      childrenState.replaceAll(getCollection<Child>(KEYS.children));
    },
    [childrenState]
  );

  const reorderRewards = useCallback(
    (orderedIds: string[]) => {
      const reordered = orderedIds
        .map((id, index) => {
          const reward = getById<Reward>(KEYS.rewards, id);
          return reward ? { ...reward, order: index } : undefined;
        })
        .filter((r): r is Reward => Boolean(r));
      reordered.forEach((r) => upsert(KEYS.rewards, r));
      rewardsState.replaceAll(getCollection<Reward>(KEYS.rewards));
    },
    [rewardsState]
  );

  const linkRepairToRedEvent = useCallback(
    (redEventId: string, starEventId: string) => {
      const event = getById<RedEvent>(KEYS.redEvents, redEventId);
      if (!event) return;
      redEventsState.update({ ...event, wasRepaired: true, repairStarEventId: starEventId });
    },
    [redEventsState]
  );

  const updateSettings = useCallback((next: AppSettings) => {
    localStorage.setItem(KEYS.settings, JSON.stringify(next));
    setSettings(next);
  }, []);

  const exportData = useCallback(() => downloadExport(), []);

  const importData = useCallback((json: unknown) => {
    const result = validateImport(json);
    if (result.valid) {
      applyImport(json as AppDataExport);
      childrenState.replaceAll(getCollection<Child>(KEYS.children));
      behaviorsState.replaceAll(getCollection<Behavior>(KEYS.behaviors));
      starEventsState.replaceAll(getCollection<StarEvent>(KEYS.starEvents));
      heartEventTypesState.replaceAll(getCollection<HeartEventType>(KEYS.heartEventTypes));
      heartEventsState.replaceAll(getCollection<HeartEvent>(KEYS.heartEvents));
      redEventTypesState.replaceAll(getCollection<RedEventType>(KEYS.redEventTypes));
      redEventsState.replaceAll(getCollection<RedEvent>(KEYS.redEvents));
      rewardsState.replaceAll(getCollection<Reward>(KEYS.rewards));
      rewardRedemptionsState.replaceAll(getCollection<RewardRedemption>(KEYS.rewardRedemptions));
      setSettings(readSettings());
    }
    return result;
  }, [
    childrenState,
    behaviorsState,
    starEventsState,
    heartEventTypesState,
    heartEventsState,
    redEventTypesState,
    redEventsState,
    rewardsState,
    rewardRedemptionsState,
  ]);

  const resetAllData = useCallback(() => {
    resetAllDataStorage();
    initializeStorage();
    childrenState.replaceAll(getCollection<Child>(KEYS.children));
    behaviorsState.replaceAll(getCollection<Behavior>(KEYS.behaviors));
    starEventsState.replaceAll(getCollection<StarEvent>(KEYS.starEvents));
    heartEventTypesState.replaceAll(getCollection<HeartEventType>(KEYS.heartEventTypes));
    heartEventsState.replaceAll(getCollection<HeartEvent>(KEYS.heartEvents));
    redEventTypesState.replaceAll(getCollection<RedEventType>(KEYS.redEventTypes));
    redEventsState.replaceAll(getCollection<RedEvent>(KEYS.redEvents));
    rewardsState.replaceAll(getCollection<Reward>(KEYS.rewards));
    rewardRedemptionsState.replaceAll(getCollection<RewardRedemption>(KEYS.rewardRedemptions));
    setSettings(readSettings());
  }, [
    childrenState,
    behaviorsState,
    starEventsState,
    heartEventTypesState,
    heartEventsState,
    redEventTypesState,
    redEventsState,
    rewardsState,
    rewardRedemptionsState,
  ]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      children: childrenState.items,
      behaviors: behaviorsState.items,
      starEvents: starEventsState.items,
      heartEventTypes: heartEventTypesState.items,
      heartEvents: heartEventsState.items,
      redEventTypes: redEventTypesState.items,
      redEvents: redEventsState.items,
      rewards: rewardsState.items,
      rewardRedemptions: rewardRedemptionsState.items,
      settings,

      addChild: childrenState.add,
      updateChild: childrenState.update,
      archiveChild: childrenState.archive,
      reorderChildren,

      addBehavior: behaviorsState.add,
      updateBehavior: behaviorsState.update,
      archiveBehavior: behaviorsState.archive,

      addStarEvent: starEventsState.add,

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

      updateSettings,

      exportData,
      importData,
      resetAllData,
    }),
    [
      childrenState,
      behaviorsState,
      starEventsState,
      heartEventTypesState,
      heartEventsState,
      redEventTypesState,
      redEventsState,
      rewardsState,
      rewardRedemptionsState,
      settings,
      reorderChildren,
      reorderRewards,
      linkRepairToRedEvent,
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
