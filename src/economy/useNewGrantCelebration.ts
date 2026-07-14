import { useEffect, useRef, useState } from "react";
import type { RewardGrant, TierId } from "./types";

// Diffs the grant-id set on every render (computeGrants recomputes fresh
// objects each call, so this compares by id, not array reference) and
// surfaces the tier of any grant that wasn't there before. The first render
// just records the current set without celebrating — otherwise reopening a
// screen would re-celebrate everything already earned in the past.
export function useNewGrantCelebration(grants: RewardGrant[]): { celebrating: TierId | null; dismiss: () => void } {
  const seenIds = useRef<Set<string> | null>(null);
  const [celebrating, setCelebrating] = useState<TierId | null>(null);

  useEffect(() => {
    const currentIds = new Set(grants.map((g) => g.id));
    if (seenIds.current === null) {
      seenIds.current = currentIds;
      return;
    }
    const newGrant = grants.find((g) => !seenIds.current!.has(g.id));
    seenIds.current = currentIds;
    if (newGrant) setCelebrating(newGrant.tierId);
  }, [grants]);

  return { celebrating, dismiss: () => setCelebrating(null) };
}
