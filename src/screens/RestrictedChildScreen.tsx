import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Reward, RewardRedemption } from "../types/entities";
import {
  getAvailableGoldStarsForChild,
  getAvailableStarsForChild,
  getFamilyHeartsCurrent,
  resolveRewardTitle,
} from "../storage/selectors";
import { generateId } from "../utils/id";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { StarBadge } from "../components/shared/StarBadge";
import { HeartBadge } from "../components/shared/HeartBadge";
import { RequestRewardModal } from "../components/modals/RequestRewardModal";
import { UnlockForm } from "./settings/AdminSettings";
import "./RestrictedChildScreen.css";

const STATUS_LABELS: Record<RewardRedemption["status"], string> = {
  pending: "⏳ ממתין לאישור",
  approved: "✅ אושר",
  rejected: "❌ נדחה",
};

interface RestrictedChildScreenProps {
  childId: string;
  onResetDevice: () => void;
}

export function RestrictedChildScreen({ childId, onResetDevice }: RestrictedChildScreenProps) {
  const {
    children,
    rewards,
    rewardRedemptions,
    starEvents,
    starAdjustments,
    heartEvents,
    settings,
    addRewardRedemption,
  } = useAppData();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [requestedMessage, setRequestedMessage] = useState(false);
  const [resettingDevice, setResettingDevice] = useState(false);

  const child = children.find((c) => c.id === childId);

  if (!child) {
    return (
      <AppShell title="לא נמצא">
        <EmptyState icon="🔍" title="הילדה לא נמצאה" message="יש לבקש מהורה לאפס את המכשיר." />
      </AppShell>
    );
  }

  const availableStars = getAvailableStarsForChild(childId, starEvents, starAdjustments, rewardRedemptions, rewards);
  const availableGoldStars = getAvailableGoldStarsForChild(
    childId,
    starEvents,
    starAdjustments,
    rewardRedemptions,
    rewards
  );
  const familyHeartsCurrent = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);
  const activeRewards = rewards.filter((r) => !r.archived).sort((a, b) => a.order - b.order);
  const myRequests = rewardRedemptions
    .filter((r) => r.childId === childId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  function getBalanceFor(reward: Reward): number {
    if (reward.type === "family") return familyHeartsCurrent;
    return reward.isGoldStar ? availableGoldStars : availableStars;
  }

  function handleConfirmRequest() {
    if (!activeReward) return;
    addRewardRedemption({
      id: generateId(),
      rewardId: activeReward.id,
      childId,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    setActiveReward(null);
    setRequestedMessage(true);
    setTimeout(() => setRequestedMessage(false), 3000);
  }

  return (
    <AppShell title={child.displayName} accent={child.color}>
      <div className="restricted-child-screen">
        <div className="restricted-child-screen__stats">
          <StarBadge value={availableStars} label="כוכבים זמינים" />
          {availableGoldStars > 0 && <StarBadge value={availableGoldStars} label="כוכבי זהב" gold />}
          <HeartBadge value={familyHeartsCurrent} label="לבבות משפחתיים" />
        </div>

        {requestedMessage && (
          <div className="restricted-child-screen__toast">הבקשה נשלחה להורים לאישור ✓</div>
        )}

        <section>
          <h2 className="restricted-child-screen__section-title">פרסים לממש</h2>
          {activeRewards.length === 0 ? (
            <EmptyState icon="🎁" title="עדיין אין פרסים מוגדרים" />
          ) : (
            <div className="restricted-child-screen__rewards">
              {activeRewards.map((reward) => (
                <button
                  key={reward.id}
                  type="button"
                  className="restricted-child-screen__reward"
                  onClick={() => setActiveReward(reward)}
                >
                  <div>
                    <p className="restricted-child-screen__reward-title">{reward.title}</p>
                    {reward.description && (
                      <p className="restricted-child-screen__reward-desc">{reward.description}</p>
                    )}
                  </div>
                  <span className="restricted-child-screen__reward-cost">
                    {reward.cost} {reward.type === "family" ? "💗" : reward.isGoldStar ? "🌟" : "⭐"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {myRequests.length > 0 && (
          <section>
            <h2 className="restricted-child-screen__section-title">הבקשות שלי</h2>
            <ul className="restricted-child-screen__requests">
              {myRequests.map((r) => (
                <li key={r.id} className="restricted-child-screen__request">
                  <div>
                    <p className="restricted-child-screen__request-title">{resolveRewardTitle(r.rewardId, rewards)}</p>
                    <p className="restricted-child-screen__request-meta">{formatHebrewDateTime(r.createdAt)}</p>
                  </div>
                  <span>{STATUS_LABELS[r.status]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="restricted-child-screen__footer">
          {resettingDevice ? (
            settings.adminPin ? (
              <UnlockForm expectedPin={settings.adminPin} onUnlock={onResetDevice} />
            ) : (
              <p className="settings-form__hint">יש להגדיר קוד ניהול קודם דרך מכשיר ההורה.</p>
            )
          ) : (
            <button type="button" className="restricted-child-screen__reset-link" onClick={() => setResettingDevice(true)}>
              איפוס מכשיר
            </button>
          )}
        </div>
      </div>

      {activeReward && (
        <RequestRewardModal
          reward={activeReward}
          availableBalance={getBalanceFor(activeReward)}
          familyHeartsCurrent={familyHeartsCurrent}
          familyHeartTarget={settings.familyHeartTarget}
          onConfirm={handleConfirmRequest}
          onClose={() => setActiveReward(null)}
        />
      )}
    </AppShell>
  );
}
