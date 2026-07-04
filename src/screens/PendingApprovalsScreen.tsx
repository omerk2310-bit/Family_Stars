import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import { getPendingRewardRedemptions, resolveChildName, resolveRewardTitle } from "../storage/selectors";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import "./PendingApprovalsScreen.css";

interface PendingApprovalsScreenProps {
  navigate: (route: Route) => void;
}

export function PendingApprovalsScreen({ navigate }: PendingApprovalsScreenProps) {
  const { children, rewards, rewardRedemptions, updateRewardRedemptionStatus } = useAppData();
  const pending = getPendingRewardRedemptions(rewardRedemptions);

  return (
    <AppShell title="בקשות ממתינות" onBack={() => navigate({ screen: "home" })}>
      <div className="pending-approvals-screen">
        {pending.length === 0 ? (
          <EmptyState icon="✅" title="אין בקשות ממתינות כרגע" message="בקשות מימוש חדשות מהילדים יופיעו כאן." />
        ) : (
          <ul className="pending-approvals-screen__list">
            {pending.map((redemption) => {
              const reward = rewards.find((r) => r.id === redemption.rewardId);
              const currencyIcon = reward?.type === "family" ? "💗" : reward?.isGoldStar ? "🌟" : "⭐";
              return (
                <li key={redemption.id} className="pending-approvals-screen__item">
                  <div>
                    <p className="pending-approvals-screen__item-title">
                      {resolveChildName(redemption.childId, children)}
                    </p>
                    <p className="pending-approvals-screen__item-meta">
                      {resolveRewardTitle(redemption.rewardId, rewards)} · {reward?.cost ?? "?"} {currencyIcon} ·{" "}
                      {formatHebrewDateTime(redemption.createdAt)}
                    </p>
                  </div>
                  <div className="pending-approvals-screen__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => updateRewardRedemptionStatus(redemption.id, "approved")}
                    >
                      אישור
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => updateRewardRedemptionStatus(redemption.id, "rejected")}
                    >
                      דחייה
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
