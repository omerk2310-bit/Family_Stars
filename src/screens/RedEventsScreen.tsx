import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import type { Route } from "../types/routes";
import { getActiveChildren, getRedEventInsights, resolveChildName, resolveRedEventTypeLabel } from "../storage/selectors";
import { generateId } from "../utils/id";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { EmptyState } from "../components/layout/EmptyState";
import { LogRedEventModal, type LogRedEventPayload } from "../components/modals/LogRedEventModal";
import "./RedEventsScreen.css";

interface RedEventsScreenProps {
  navigate: (route: Route) => void;
}

export function RedEventsScreen({ navigate }: RedEventsScreenProps) {
  const { children, behaviors, redEventTypes, redEvents, addRedEvent, addStarEvent, linkRepairToRedEvent } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);

  const activeChildren = getActiveChildren(children);
  const insights = getRedEventInsights(redEvents, redEventTypes);
  const recentEvents = [...redEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  function handleConfirm(payload: LogRedEventPayload) {
    const redEventId = generateId();

    addRedEvent({
      id: redEventId,
      childId: payload.childId,
      redEventTypeId: payload.redEventTypeId,
      note: payload.note,
      createdAt: new Date().toISOString(),
      wasRepaired: false,
    });

    if (payload.wasRepaired && payload.childId && payload.repairBehaviorId) {
      const starEventId = generateId();
      const repairBehavior = behaviors.find((b) => b.id === payload.repairBehaviorId);
      addStarEvent({
        id: starEventId,
        childId: payload.childId,
        behaviorId: payload.repairBehaviorId,
        pointsAwarded: payload.repairPoints ?? 0,
        note: "תיקון לאחר אירוע אדום",
        createdAt: new Date().toISOString(),
        isGoldStar: repairBehavior?.isGoldStar ?? false,
        status: "approved",
      });
      linkRepairToRedEvent(redEventId, starEventId);
    }

    setModalOpen(false);
  }

  return (
    <AppShell title="אירועים אדומים" onBack={() => navigate({ screen: "home" })}>
      <div className="red-events-screen">
        <p className="red-events-screen__intro">
          המסך הזה מיועד להורים בלבד, לתיעוד רגעים קשים לצורך זיהוי דפוסים — הוא לעולם לא מוריד כוכבים.
        </p>

        <button
          type="button"
          className="btn btn--amber"
          onClick={() => setModalOpen(true)}
          disabled={activeChildren.length === 0}
        >
          🛡️ רישום אירוע אדום
        </button>

        <section>
          <h2 className="red-events-screen__section-title">דפוסים שראינו</h2>
          {insights.totalCount === 0 ? (
            <EmptyState icon="🕊️" title="עדיין אין נתונים" message="ברגע שיתועדו אירועים, כאן יופיעו תובנות." />
          ) : (
            <div className="red-events-screen__insights">
              <div className="red-events-screen__insight-card">
                <p className="red-events-screen__insight-title">סוגי האירועים הנפוצים</p>
                <ul>
                  {insights.topTypes.map((t) => (
                    <li key={t.label}>
                      {t.label} — {t.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="red-events-screen__insight-card">
                <p className="red-events-screen__insight-title">שעות ביום</p>
                <ul>
                  {insights.byTimeOfDay.map((t) => (
                    <li key={t.label}>
                      {t.label} — {t.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="red-events-screen__insight-card">
                <p className="red-events-screen__insight-title">תיקונים</p>
                <p>
                  {insights.repairCount} מתוך {insights.totalCount} אירועים הסתיימו בתיקון.
                </p>
              </div>
            </div>
          )}
        </section>

        {recentEvents.length > 0 && (
          <section>
            <h2 className="red-events-screen__section-title">אירועים אחרונים</h2>
            <ul className="red-events-screen__list">
              {recentEvents.map((event) => (
                <li key={event.id} className="red-events-screen__list-item">
                  <div>
                    <p className="red-events-screen__list-label">{resolveRedEventTypeLabel(event.redEventTypeId, redEventTypes)}</p>
                    <p className="red-events-screen__list-meta">
                      {resolveChildName(event.childId, children) || "כללי"} · {formatHebrewDateTime(event.createdAt)}
                    </p>
                  </div>
                  {event.wasRepaired && <span className="red-events-screen__repaired-tag">תוקן</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {modalOpen && (
        <LogRedEventModal
          children={activeChildren}
          redEventTypes={redEventTypes}
          behaviors={behaviors}
          onConfirm={handleConfirm}
          onClose={() => setModalOpen(false)}
        />
      )}
    </AppShell>
  );
}
