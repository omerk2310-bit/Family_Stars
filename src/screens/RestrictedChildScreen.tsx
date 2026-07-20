import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Behavior, Reward } from "../types/entities";
import { getActiveBehaviorsForChild, getFamilyHeartsCurrent } from "../storage/selectors";
import { generateId } from "../utils/id";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { HeartBadge } from "../components/shared/HeartBadge";
import { BehaviorButton } from "../components/shared/BehaviorButton";
import { LogStarEventModal } from "../components/modals/LogStarEventModal";
import { RequestRewardModal } from "../components/modals/RequestRewardModal";
import { UnlockForm } from "./settings/AdminSettings";
import { PushOptIn } from "../notifications/PushOptIn";
import { useEconomyForChild } from "../economy/useEconomyForChild";
import { useNewGrantCelebration } from "../economy/useNewGrantCelebration";
import { useStarTickSound } from "../economy/useStarTickSound";
import { TierProgressRow } from "../economy/TierProgressRow";
import { TierCelebration } from "../economy/TierCelebration";
import "./RestrictedChildScreen.css";

const SIZE_LABELS: Record<string, string> = { small: "פרס קטן", medium: "פרס בינוני", large: "פרס גדול" };

interface RestrictedChildScreenProps {
  childId: string;
  onResetDevice: () => void;
}

export function RestrictedChildScreen({ childId, onResetDevice }: RestrictedChildScreenProps) {
  const {
    children,
    behaviors,
    rewards,
    rewardRedemptions,
    heartEvents,
    legacyGrants,
    rewardDefinitions,
    settings,
    addRewardRedemption,
    addStarEvent,
  } = useAppData();
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [activeBehavior, setActiveBehavior] = useState<Behavior | null>(null);
  const [requestedMessage, setRequestedMessage] = useState<string | null>(null);
  const [resettingDevice, setResettingDevice] = useState(false);

  const child = children.find((c) => c.id === childId);
  const { state, grants, config } = useEconomyForChild(childId);
  const { celebrating, dismiss } = useNewGrantCelebration(grants);
  const celebratingTier = celebrating ? config.tiers.find((t) => t.id === celebrating) : null;

  const cappedTier = config.tiers.find((t) => t.source.type === "behavior" && t.capped);
  const cappedState = cappedTier ? state[cappedTier.id] : null;
  useStarTickSound(cappedState?.earned ?? 0, cappedState?.target ?? 0);

  if (!child) {
    return (
      <AppShell title="לא נמצא">
        <EmptyState icon="🔍" title="הילדה לא נמצאה" message="יש לבקש מהורה לאפס את המכשיר." />
      </AppShell>
    );
  }

  const activeBehaviors = getActiveBehaviorsForChild(child.id, behaviors);
  // Same cap-clamping rule the parent's logging tool used to enforce (target
  // also acts as a hard ceiling for capped tiers) — moved here since the
  // child now initiates the request. `remaining` only reflects already-
  // approved progress, so a child can still queue requests that together
  // exceed the cap; the parent reviewing each one is the real backstop now.
  const remaining = cappedState ? Math.max(0, cappedState.target - cappedState.earned) : Infinity;
  const atCap = remaining <= 0;

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
    setRequestedMessage("הבקשה נשלחה להורים לאישור ✓");
    setTimeout(() => setRequestedMessage(null), 3000);
  }

  function handleConfirmBehavior(points: number, note?: string) {
    if (!activeBehavior) return;
    setActiveBehavior(null);
    const requested = Math.min(points, remaining);
    if (requested <= 0) return;
    addStarEvent({
      id: generateId(),
      childId: child!.id,
      behaviorId: activeBehavior.id,
      pointsAwarded: requested,
      note,
      createdAt: new Date().toISOString(),
      isGoldStar: false,
      status: "pending",
    });
    setRequestedMessage("הבקשה נשלחה להורים לאישור ✓");
    setTimeout(() => setRequestedMessage(null), 3000);
  }

  return (
    <AppShell title={child.displayName} accent={child.color}>
      <div className="restricted-child-screen">
        <TierProgressRow config={config} state={state} />

        {requestedMessage && <div className="restricted-child-screen__toast">{requestedMessage}</div>}

        {atCap && <div className="restricted-child-screen__cap-message">הגעת ליעד היומי. איזה יום חזק! 🌟</div>}

        <section>
          <h2 className="restricted-child-screen__section-title">מה עשיתי היום?</h2>
          {activeBehaviors.length === 0 ? (
            <EmptyState icon="🌱" title="עוד אין התנהגויות מוגדרות" message="יש לבקש מהורה להוסיף התנהגויות במסך ההגדרות." />
          ) : (
            <div className="restricted-child-screen__behaviors">
              {activeBehaviors.map((behavior) => (
                <BehaviorButton
                  key={behavior.id}
                  behavior={behavior}
                  disabled={atCap}
                  onClick={() => setActiveBehavior(behavior)}
                />
              ))}
            </div>
          )}
        </section>

        <HeartBadge value={familyHeartsCurrent} label="לבבות משפחתיים" />

        <PushOptIn role="child" childId={childId} />

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

      {activeBehavior && (
        <LogStarEventModal behavior={activeBehavior} onConfirm={handleConfirmBehavior} onClose={() => setActiveBehavior(null)} />
      )}

      {celebratingTier && (
        <TierCelebration tierId={celebratingTier.id} label={celebratingTier.label} icon={celebratingTier.icon} onDone={dismiss} />
      )}
    </AppShell>
  );
}
