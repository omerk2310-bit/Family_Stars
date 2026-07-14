import { useAppData } from "../state/AppDataContext";
import { getActiveChildren } from "../storage/selectors";
import { getGrantsForChild } from "../economy/economySelectors";
import type { RewardGrant } from "../economy/types";
import type { Child, LegacyGrant } from "../types/entities";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { formatHebrewDateTime } from "../utils/format";
import type { Route } from "../types/routes";
import "./InstantRewardsGrantsScreen.css";

const SIZE_LABELS: Record<string, string> = { small: "פרס קטן", medium: "פרס בינוני", large: "פרס גדול" };

interface InstantRewardsGrantsScreenProps {
  navigate: (route: Route) => void;
}

export function InstantRewardsGrantsScreen({ navigate }: InstantRewardsGrantsScreenProps) {
  const { children, starEvents, settings, rewardClaims, legacyGrants, claimRewardGrant, claimLegacyGrant, rewardDefinitions } =
    useAppData();
  const activeChildren = getActiveChildren(children);
  const now = new Date();

  const pendingByChild: { child: Child; grant: RewardGrant }[] = activeChildren.flatMap((child) =>
    getGrantsForChild(child.id, starEvents, settings.economyStartsAt, settings.economyConfig, rewardClaims, now)
      .filter((g) => g.claimedAt === null)
      .map((grant) => ({ child, grant }))
  );

  const pendingLegacy: { child: Child; legacy: LegacyGrant }[] = [];
  for (const legacy of legacyGrants) {
    if (legacy.claimedAt) continue;
    const child = children.find((c) => c.id === legacy.childId);
    if (child) pendingLegacy.push({ child, legacy });
  }

  const isEmpty = pendingByChild.length === 0 && pendingLegacy.length === 0;

  return (
    <AppShell title="מתנות לחלוקה" onBack={() => navigate({ screen: "home" })}>
      <div className="instant-rewards-grants">
        {isEmpty ? (
          <EmptyState icon="🎁" title="אין מתנות ממתינות כרגע" message="ברגע שילד/ה יגיעו ליעד, המתנה תופיע כאן." />
        ) : (
          <ul className="instant-rewards-grants__list">
            {pendingByChild.map(({ child, grant }) => {
              const definition = rewardDefinitions.find((d) => d.size === grant.size);
              return (
                <li key={grant.id} className="instant-rewards-grants__item">
                  <div>
                    <p className="instant-rewards-grants__title">
                      {child.displayName} — {definition?.label ?? SIZE_LABELS[grant.size]}
                    </p>
                    <p className="instant-rewards-grants__meta">
                      {definition?.description ? `${definition.description} · ` : ""}
                      {formatHebrewDateTime(grant.grantedAt)}
                    </p>
                    {definition && definition.examples.length > 0 && (
                      <p className="instant-rewards-grants__examples">רעיונות: {definition.examples.join(", ")}</p>
                    )}
                  </div>
                  <button type="button" className="btn btn--primary" onClick={() => claimRewardGrant(grant)}>
                    נמסר ✓
                  </button>
                </li>
              );
            })}
            {pendingLegacy.map(({ child, legacy }) => (
              <li key={legacy.id} className="instant-rewards-grants__item">
                <div>
                  <p className="instant-rewards-grants__title">{child.displayName} — מתנת פרידה גדולה</p>
                  <p className="instant-rewards-grants__meta">{legacy.sourceNote}</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={() => claimLegacyGrant(legacy.id)}>
                  נמסר ✓
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
