import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import type { Reward } from "../types/entities";
import { getActiveChildren, getFamilyHeartsCurrent } from "../storage/selectors";
import { generateId } from "../utils/id";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { RedeemRewardModal } from "../components/modals/RedeemRewardModal";
import "./RewardsScreen.css";

interface RewardsScreenProps {
  navigate: (route: Route) => void;
}

// Personal (small/medium) reward redemption is retired in favor of the
// instant bronze/silver/gold tier system — this screen now only serves
// family-shared rewards, which remain a separate, untouched track.
export function RewardsScreen({ navigate }: RewardsScreenProps) {
  const { children, rewards, rewardRedemptions, heartEvents, settings, addRewardRedemption } = useAppData();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);

  const activeChildren = getActiveChildren(children);
  const familyRewards = rewards.filter((r) => r.type === "family" && !r.archived).sort((a, b) => a.order - b.order);
  const familyHeartsCurrent = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);

  function handleConfirm(childId?: string) {
    if (!activeReward) return;
    addRewardRedemption({
      id: generateId(),
      rewardId: activeReward.id,
      childId,
      createdAt: new Date().toISOString(),
      status: "approved",
    });
    setActiveReward(null);
  }

  return (
    <AppShell title="מימוש פרסים משפחתיים" onBack={() => navigate({ screen: "home" })}>
      <div className="rewards-screen">
        {familyRewards.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="עדיין אין פרסים משפחתיים מוגדרים"
            message="אפשר להוסיף פרסים במסך ההגדרות."
            action={
              <button type="button" className="btn btn--primary" onClick={() => navigate({ screen: "settings", tab: "rewards" })}>
                מעבר להגדרות
              </button>
            }
          />
        ) : (
          <div className="rewards-screen__list">
            {familyRewards.map((reward) => (
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
                <span className="rewards-screen__item-cost">{reward.cost} 💗</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeReward && (
        <RedeemRewardModal
          reward={activeReward}
          children={activeChildren}
          getAvailableStars={() => 0}
          familyHeartsCurrent={familyHeartsCurrent}
          familyHeartTarget={settings.familyHeartTarget}
          onConfirm={handleConfirm}
          onClose={() => setActiveReward(null)}
        />
      )}
    </AppShell>
  );
}
