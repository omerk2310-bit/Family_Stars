import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import type { Behavior } from "../types/entities";
import { getActiveBehaviorsForChild } from "../storage/selectors";
import { generateId } from "../utils/id";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { BehaviorButton } from "../components/shared/BehaviorButton";
import { LogStarEventModal } from "../components/modals/LogStarEventModal";
import { useEconomyForChild } from "../economy/useEconomyForChild";
import { useNewGrantCelebration } from "../economy/useNewGrantCelebration";
import { TierProgressRow } from "../economy/TierProgressRow";
import { TierCelebration } from "../economy/TierCelebration";
import { playStarTick, vibrateShort } from "../economy/audio";
import "./ChildScreen.css";

interface ChildScreenProps {
  childId: string;
  navigate: (route: Route) => void;
}

export function ChildScreen({ childId, navigate }: ChildScreenProps) {
  const { children, behaviors, addStarEvent } = useAppData();
  const [activeBehavior, setActiveBehavior] = useState<Behavior | null>(null);

  const child = children.find((c) => c.id === childId);
  const { state, grants, config } = useEconomyForChild(childId);
  const { celebrating, dismiss } = useNewGrantCelebration(grants);
  const celebratingTier = celebrating ? config.tiers.find((t) => t.id === celebrating) : null;

  if (!child) {
    return (
      <AppShell title="לא נמצא" onBack={() => navigate({ screen: "home" })}>
        <EmptyState icon="🔍" title="הילדה לא נמצאה" message="ייתכן שהיא הוסרה. אפשר לחזור לדף הבית." />
      </AppShell>
    );
  }

  const activeBehaviors = getActiveBehaviorsForChild(child.id, behaviors);

  function handleConfirm(points: number, note?: string) {
    if (!activeBehavior) return;
    setActiveBehavior(null);
    addStarEvent({
      id: generateId(),
      childId: child!.id,
      behaviorId: activeBehavior.id,
      pointsAwarded: points,
      note,
      createdAt: new Date().toISOString(),
      isGoldStar: false,
    });
    // Bronze earned-so-far-today (after this event) drives the pitch-ladder
    // step — a bigger behavior naturally jumps further up the scale.
    playStarTick(state.bronze.earned + points);
    vibrateShort();
  }

  return (
    <AppShell title={child.displayName} onBack={() => navigate({ screen: "home" })} accent={child.color}>
      <div className="child-screen">
        <TierProgressRow config={config} state={state} />

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
              <BehaviorButton key={behavior.id} behavior={behavior} onClick={() => setActiveBehavior(behavior)} />
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

      {celebratingTier && (
        <TierCelebration tierId={celebratingTier.id} label={celebratingTier.label} icon={celebratingTier.icon} onDone={dismiss} />
      )}
    </AppShell>
  );
}
