import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import type { StarEvent } from "../types/entities";
import {
  getPendingRewardRedemptions,
  getPendingStarEvents,
  resolveBehaviorName,
  resolveChildName,
  resolveRewardTitle,
} from "../storage/selectors";
import { formatHebrewDateTime } from "../utils/format";
import { parseIntOrFallback, stripNonDigits } from "../utils/numericInput";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import "./PendingApprovalsScreen.css";

interface PendingApprovalsScreenProps {
  navigate: (route: Route) => void;
}

export function PendingApprovalsScreen({ navigate }: PendingApprovalsScreenProps) {
  const { children, rewards, rewardRedemptions, updateRewardRedemptionStatus, behaviors, starEvents, updateStarEventStatus } =
    useAppData();
  const pendingRedemptions = getPendingRewardRedemptions(rewardRedemptions);
  const pendingStars = getPendingStarEvents(starEvents);
  const isEmpty = pendingRedemptions.length === 0 && pendingStars.length === 0;

  return (
    <AppShell title="בקשות ממתינות" onBack={() => navigate({ screen: "home" })}>
      <div className="pending-approvals-screen">
        {isEmpty ? (
          <EmptyState icon="✅" title="אין בקשות ממתינות כרגע" message="בקשות כוכבים ומימוש חדשות מהילדים יופיעו כאן." />
        ) : (
          <ul className="pending-approvals-screen__list">
            {pendingStars.map((event) => (
              <PendingStarEventItem
                key={event.id}
                event={event}
                childName={resolveChildName(event.childId, children)}
                behaviorName={resolveBehaviorName(event.behaviorId, behaviors)}
                onApprove={(amount) => updateStarEventStatus(event.id, "approved", amount)}
                onReject={() => updateStarEventStatus(event.id, "rejected")}
              />
            ))}
            {pendingRedemptions.map((redemption) => {
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

interface PendingStarEventItemProps {
  event: StarEvent;
  childName: string;
  behaviorName: string;
  onApprove: (amount: number) => void;
  onReject: () => void;
}

// The parent can edit the requested point amount before approving — the
// numeric input defaults to what the child asked for, editable the same way
// every other numeric field in this app is (stripNonDigits + parseIntOrFallback).
function PendingStarEventItem({ event, childName, behaviorName, onApprove, onReject }: PendingStarEventItemProps) {
  const [amount, setAmount] = useState(String(event.pointsAwarded));
  const parsed = Math.max(0, parseIntOrFallback(amount, event.pointsAwarded));

  return (
    <li className="pending-approvals-screen__item">
      <div>
        <p className="pending-approvals-screen__item-title">{childName}</p>
        <p className="pending-approvals-screen__item-meta">
          {behaviorName}
          {event.note ? ` · ${event.note}` : ""} · {formatHebrewDateTime(event.createdAt)}
        </p>
      </div>
      <div className="pending-approvals-screen__actions">
        <input
          type="text"
          inputMode="numeric"
          className="pending-approvals-screen__amount"
          value={amount}
          onChange={(e) => setAmount(stripNonDigits(e.target.value))}
          aria-label="כמות כוכבים לאישור"
        />
        <span>⭐</span>
        <button type="button" className="btn btn--primary" disabled={parsed <= 0} onClick={() => onApprove(parsed)}>
          אישור
        </button>
        <button type="button" className="btn btn--secondary" onClick={onReject}>
          דחייה
        </button>
      </div>
    </li>
  );
}
