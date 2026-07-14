import { useAppData } from "../state/AppDataContext";
import { useWeekRange } from "../hooks/useWeekRange";
import type { Route } from "../types/routes";
import {
  getActiveChildren,
  getRedEventInsights,
  getThisWeekEventsForChild,
  getThisWeekHeartEvents,
  getTopBehaviorsThisWeek,
} from "../storage/selectors";
import { generateWeeklySentence } from "../utils/sentenceTemplates";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { ChildAvatar } from "../components/shared/ChildAvatar";
import { useEconomyForChild } from "../economy/useEconomyForChild";
import { TierProgressRow } from "../economy/TierProgressRow";
import "./WeeklySummaryScreen.css";

interface WeeklySummaryScreenProps {
  navigate: (route: Route) => void;
}

export function WeeklySummaryScreen({ navigate }: WeeklySummaryScreenProps) {
  const { children, starEvents, heartEvents, redEvents, redEventTypes } = useAppData();
  const { start } = useWeekRange();
  const reference = new Date();

  const activeChildren = getActiveChildren(children);
  const weekHearts = getThisWeekHeartEvents(heartEvents, reference).reduce((sum, e) => sum + e.heartsAwarded, 0);
  const insights = getRedEventInsights(redEvents, redEventTypes);

  return (
    <AppShell title="סיכום שבועי" onBack={() => navigate({ screen: "home" })}>
      <div className="weekly-summary-screen">
        <p className="weekly-summary-screen__range">השבוע שהתחיל ב-{start.toLocaleDateString("he-IL")}</p>

        {activeChildren.length === 0 ? (
          <EmptyState icon="🌟" title="עוד אין ילדים במערכת" message="אפשר להוסיף ילדה חדשה במסך ההגדרות." />
        ) : (
          activeChildren.map((child) => {
            const weekEvents = getThisWeekEventsForChild(child.id, starEvents, reference);
            const weekStars = weekEvents.reduce((sum, e) => sum + e.pointsAwarded, 0);

            return <ChildWeeklyCard key={child.id} childId={child.id} weekStars={weekStars} />;
          })
        )}

        <section>
          <h2 className="weekly-summary-screen__section-title">לבבות משפחתיים השבוע</h2>
          <p className="weekly-summary-screen__hearts">💗 {weekHearts}</p>
        </section>

        <section>
          <h2 className="weekly-summary-screen__section-title">דפוסים שראינו (להורים)</h2>
          {insights.totalCount === 0 ? (
            <p className="weekly-summary-screen__muted">עוד אין מספיק נתונים.</p>
          ) : (
            <div className="weekly-summary-screen__red-summary">
              <p>
                {insights.repairCount} מתוך {insights.totalCount} אירועים הסתיימו בתיקון.
              </p>
              {insights.topTypes[0] && <p>הסוג הנפוץ ביותר: {insights.topTypes[0].label}</p>}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ChildWeeklyCard({ childId, weekStars }: { childId: string; weekStars: number }) {
  const { children, behaviors, starEvents } = useAppData();
  const reference = new Date();
  const child = children.find((c) => c.id === childId);
  const { state, config } = useEconomyForChild(childId);
  if (!child) return null;

  const topBehaviors = getTopBehaviorsThisWeek(childId, starEvents, behaviors, reference);
  const sentence = generateWeeklySentence(child.displayName, topBehaviors);

  return (
    <section className="weekly-summary-card" style={{ borderInlineStartColor: child.color }}>
      <header className="weekly-summary-card__header">
        <ChildAvatar icon={child.icon} color={child.color} size="sm" />
        <h3>{child.displayName}</h3>
      </header>

      <TierProgressRow config={config} state={state} />

      {topBehaviors.length === 0 ? (
        <p className="weekly-summary-screen__muted">עוד אין מספיק נתונים השבוע</p>
      ) : (
        <>
          <p className="weekly-summary-card__stars">⭐ {weekStars} כוכבים השבוע</p>
          <div>
            <p className="weekly-summary-card__label">חוזקות השבוע</p>
            <ul className="weekly-summary-card__strengths">
              {topBehaviors.map((b) => (
                <li key={b.behaviorId}>
                  {b.title} ({b.count} פעמים)
                </li>
              ))}
            </ul>
          </div>
          <p className="weekly-summary-card__sentence">{sentence}</p>
        </>
      )}
    </section>
  );
}
