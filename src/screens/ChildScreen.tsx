import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { useToday } from "../hooks/useToday";
import type { Route } from "../types/routes";
import type { Behavior } from "../types/entities";
import {
  getActiveBehaviorsForChild,
  getAvailableStarsForChild,
  getLifetimeXpForChild,
  getTodayStarsForChild,
} from "../storage/selectors";
import { generateId } from "../utils/id";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { StarBadge } from "../components/shared/StarBadge";
import { BehaviorButton } from "../components/shared/BehaviorButton";
import { LogStarEventModal } from "../components/modals/LogStarEventModal";
import "./ChildScreen.css";

interface ChildScreenProps {
  childId: string;
  navigate: (route: Route) => void;
}

export function ChildScreen({ childId, navigate }: ChildScreenProps) {
  const { children, behaviors, starEvents, starAdjustments, rewardRedemptions, rewards, settings, addStarEvent } =
    useAppData();
  const today = useToday();
  const [activeBehavior, setActiveBehavior] = useState<Behavior | null>(null);

  const child = children.find((c) => c.id === childId);

  if (!child) {
    return (
      <AppShell title="לא נמצא" onBack={() => navigate({ screen: "home" })}>
        <EmptyState icon="🔍" title="הילדה לא נמצאה" message="ייתכן שהיא הוסרה. אפשר לחזור לדף הבית." />
      </AppShell>
    );
  }

  const todayStars = getTodayStarsForChild(child.id, starEvents, today);
  const availableStars = getAvailableStarsForChild(child.id, starEvents, starAdjustments, rewardRedemptions, rewards);
  const lifetimeXp = getLifetimeXpForChild(child.id, starEvents, starAdjustments);
  const activeBehaviors = getActiveBehaviorsForChild(child.id, behaviors);
  const atDailyCap = todayStars >= settings.dailyStarCap;

  function handleConfirm(points: number, note?: string) {
    if (!activeBehavior) return;
    const remaining = Math.max(0, settings.dailyStarCap - todayStars);
    const awarded = Math.min(points, remaining);
    setActiveBehavior(null);
    if (awarded <= 0) return;
    addStarEvent({
      id: generateId(),
      childId: child!.id,
      behaviorId: activeBehavior.id,
      pointsAwarded: awarded,
      note,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <AppShell title={child.displayName} onBack={() => navigate({ screen: "home" })} accent={child.color}>
      <div className="child-screen">
        <div className="child-screen__stats">
          <StarBadge value={availableStars} label="כוכבים זמינים" />
          <div className="child-screen__stat">
            <span className="child-screen__stat-value">{todayStars} / {settings.dailyStarCap}</span>
            <span className="child-screen__stat-label">כוכבים היום</span>
          </div>
          <div className="child-screen__stat">
            <span className="child-screen__stat-value">{lifetimeXp}</span>
            <span className="child-screen__stat-label">ניסיון מצטבר</span>
          </div>
        </div>

        {atDailyCap && (
          <div className="child-screen__cap-message">הגעת למקסימום היומי. איזה יום חזק! 🌟</div>
        )}

        {activeBehaviors.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="עוד אין התנהגויות מוגדרות"
            message="אפשר להוסיף התנהגויות עבורה במסך ההגדרות."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate({ screen: "settings", tab: "behaviors" })}
              >
                מעבר להגדרות
              </button>
            }
          />
        ) : (
          <div className="child-screen__behaviors">
            {activeBehaviors.map((behavior) => (
              <BehaviorButton
                key={behavior.id}
                behavior={behavior}
                disabled={atDailyCap}
                onClick={() => setActiveBehavior(behavior)}
              />
            ))}
          </div>
        )}
      </div>

      {activeBehavior && (
        <LogStarEventModal
          behavior={activeBehavior}
          onConfirm={handleConfirm}
          onClose={() => setActiveBehavior(null)}
        />
      )}
    </AppShell>
  );
}
