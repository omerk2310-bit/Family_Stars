import { useAppData } from "../state/AppDataContext";
import { getEconomyStateForChild, getGrantsForChild } from "./economySelectors";
import type { EconomyConfig, RewardGrant, TierId, TierState } from "./types";

export interface EconomyForChild {
  state: Record<TierId, TierState>;
  grants: RewardGrant[];
  config: EconomyConfig;
}

export function useEconomyForChild(childId: string): EconomyForChild {
  const { starEvents, settings, rewardClaims } = useAppData();
  const now = new Date();
  const state = getEconomyStateForChild(childId, starEvents, settings.economyStartsAt, settings.economyConfig, now);
  const grants = getGrantsForChild(
    childId,
    starEvents,
    settings.economyStartsAt,
    settings.economyConfig,
    rewardClaims,
    now
  );
  return { state, grants, config: settings.economyConfig };
}
