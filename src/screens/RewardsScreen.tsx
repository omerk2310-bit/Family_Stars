import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import type { Reward } from "../types/entities";
import { getActiveChildren, getAvailableStarsForChild, getFamilyHeartsCurrent } from "../storage/selectors";
import { generateId } from "../utils/id";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { RedeemRewardModal } from "../components/modals/RedeemRewardModal";
import "./RewardsScreen.css";

interface RewardsScreenProps {
  navigate: (route: Route) => void;
}

const GROUP_LABELS: Record<Reward["type"], string> = {
  small: "פרסים קטנים",
  medium: "פרסים בינוניים",
  family: "פרסים משפחתיים",
};

export function RewardsScreen({ navigate }: RewardsScreenProps) {
  const { children, rewards, rewardRedemptions, starEvents, starAdjustments, heartEvents, settings, addRewardRedemption } =
    useAppData();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);

  const activeChildren = getActiveChildren(children);
  const activeRewards = rewards.filter((r) => !r.archived).sort((a, b) => a.order - b.order);
  const familyHeartsCurrent = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);

  const groups: Reward["type"][] = ["small", "medium", "family"];

  function handleConfirm(childId?: string) {
    if (!activeReward) return;
    addRewardRedemption({
      id: generateId(),
      rewardId: activeReward.id,
      childId,
      createdAt: new Date().toISOString(),
    });
    setActiveReward(null);
  }

  return (
    <AppShell title="מימוש פרסים" onBack={() => navigate({ screen: "home" })}>
      <div className="rewards-screen">
        {activeRewards.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="עדיין אין פרסים מוגדרים"
            message="אפשר להוסיף פרסים במסך ההגדרות."
            action={
              <button type="button" className="btn btn--primary" onClick={() => navigate({ screen: "settings", tab: "rewards" })}>
                מעבר להגדרות
              </button>
            }
          />
        ) : (
          groups.map((group) => {
            const items = activeRewards.filter((r) => r.type === group);
            if (items.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="rewards-screen__section-title">{GROUP_LABELS[group]}</h2>
                <div className="rewards-screen__list">
                  {items.map((reward) => (
                    <button
                      key={reward.id}
                      type="button"
                      className="rewards-screen__item"
                      onClick={() => setActiveReward(reward)}
                    >
                      <div>
                        <p className="rewards-screen__item-title">{reward.title}</p>
                        {reward.description && <p className="rewards-screen__item-desc">{reward.description}</p>}
                      </div>
                      <span className="rewards-screen__item-cost">
                        {reward.cost} {group === "family" ? "💗" : "⭐"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {activeReward && (
        <RedeemRewardModal
          reward={activeReward}
          children={activeChildren}
          getAvailableStars={(childId) =>
            getAvailableStarsForChild(childId, starEvents, starAdjustments, rewardRedemptions, rewards)
          }
          familyHeartsCurrent={familyHeartsCurrent}
          familyHeartTarget={settings.familyHeartTarget}
          onConfirm={handleConfirm}
          onClose={() => setActiveReward(null)}
        />
      )}
    </AppShell>
  );
}
