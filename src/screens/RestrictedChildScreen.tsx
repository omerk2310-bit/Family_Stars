import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Reward } from "../types/entities";
import { getFamilyHeartsCurrent } from "../storage/selectors";
import { generateId } from "../utils/id";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { HeartBadge } from "../components/shared/HeartBadge";
import { RequestRewardModal } from "../components/modals/RequestRewardModal";
import { UnlockForm } from "./settings/AdminSettings";
import { useEconomyForChild } from "../economy/useEconomyForChild";
import { useNewGrantCelebration } from "../economy/useNewGrantCelebration";
import { TierProgressRow } from "../economy/TierProgressRow";
import { TierCelebration } from "../economy/TierCelebration";
import "./RestrictedChildScreen.css";

const SIZE_LABELS: Record<string, string> = { small: "פרס קטן", medium: "פרס בינוני", large: "פרס גדול" };

interface RestrictedChildScreenProps {
  childId: string;
  onResetDevice: () => void;
}

export function RestrictedChildScreen({ childId, onResetDevice }: RestrictedChildScreenProps) {
  const { children, rewards, rewardRedemptions, heartEvents, legacyGrants, rewardDefinitions, settings, addRewardRedemption } =
    useAppData();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [requestedMessage, setRequestedMessage] = useState(false);
  const [resettingDevice, setResettingDevice] = useState(false);

  const child = children.find((c) => c.id === childId);
  const { state, grants, config } = useEconomyForChild(childId);
  const { celebrating, dismiss } = useNewGrantCelebration(grants);
  const celebratingTier = celebrating ? config.tiers.find((t) => t.id === celebrating) : null;

  if (!child) {
    return (
      <AppShell title="לא נמצא">
        <EmptyState icon="🔍" title="הילדה לא נמצאה" message="יש לבקש מהורה לאפס את המכשיר." />
      </AppShell>
    );
  }

  const familyHeartsCurrent = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);
  const familyRewards = rewards.filter((r) => r.type === "family" && !r.archived).sort((a, b) => a.order - b.order);
  const myLegacyGrant = legacyGrants.find((g) => g.childId === childId);

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
        <TierProgressRow config={config} state={state} />

        <HeartBadge value={familyHeartsCurrent} label="לבבות משפחתיים" />

        {requestedMessage && <div className="restricted-child-screen__toast">הבקשה נשלחה להורים לאישור ✓</div>}

        <section>
          <h2 className="restricted-child-screen__section-title">המתנות שלי</h2>
          {grants.length === 0 && !myLegacyGrant ? (
            <EmptyState icon="🎁" title="עוד אין מתנות" message="ברגע שתגיעו ליעד, המתנה תופיע כאן." />
          ) : (
            <ul className="restricted-child-screen__requests">
              {myLegacyGrant && (
                <li className="restricted-child-screen__request">
                  <div>
                    <p className="restricted-child-screen__request-title">מתנת פרידה גדולה</p>
                    <p className="restricted-child-screen__request-meta">{myLegacyGrant.sourceNote}</p>
                  </div>
                  <span>{myLegacyGrant.claimedAt ? "✅ נמסר" : "⏳ ממתין למסירה"}</span>
                </li>
              )}
              {grants.map((grant) => {
                const definition = rewardDefinitions.find((d) => d.size === grant.size);
                return (
                  <li key={grant.id} className="restricted-child-screen__request">
                    <div>
                      <p className="restricted-child-screen__request-title">{definition?.label ?? SIZE_LABELS[grant.size]}</p>
                      <p className="restricted-child-screen__request-meta">{formatHebrewDateTime(grant.grantedAt)}</p>
                    </div>
                    <span>{grant.claimedAt ? "✅ נמסר" : "⏳ ממתין למסירה"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {familyRewards.length > 0 && (
          <section>
            <h2 className="restricted-child-screen__section-title">פרסים משפחתיים</h2>
            <div className="restricted-child-screen__rewards">
              {familyRewards.map((reward) => (
                <button
                  key={reward.id}
                  type="button"
                  className="restricted-child-screen__reward"
                  onClick={() => setActiveReward(reward)}
                >
                  <div>
                    <p className="restricted-child-screen__reward-title">{reward.title}</p>
                    {reward.description && <p className="restricted-child-screen__reward-desc">{reward.description}</p>}
                  </div>
                  <span className="restricted-child-screen__reward-cost">{reward.cost} 💗</span>
                </button>
              ))}
            </div>
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
          availableBalance={familyHeartsCurrent}
          familyHeartsCurrent={familyHeartsCurrent}
          familyHeartTarget={settings.familyHeartTarget}
          onConfirm={handleConfirmRequest}
          onClose={() => setActiveReward(null)}
        />
      )}

      {celebratingTier && (
        <TierCelebration tierId={celebratingTier.id} label={celebratingTier.label} icon={celebratingTier.icon} onDone={dismiss} />
      )}
    </AppShell>
  );
}
