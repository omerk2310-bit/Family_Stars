import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { useToday } from "../hooks/useToday";
import type { Route } from "../types/routes";
import type { HeartEventType } from "../types/entities";
import { getFamilyHeartsCurrent, getTodayHeartsTotal } from "../storage/selectors";
import { generateId } from "../utils/id";
import { formatHebrewDateTime } from "../utils/format";
import { AppShell } from "../components/layout/AppShell";
import { HeartBadge } from "../components/shared/HeartBadge";
import { LogHeartEventModal } from "../components/modals/LogHeartEventModal";
import "./FamilyHeartsScreen.css";

interface FamilyHeartsScreenProps {
  navigate: (route: Route) => void;
}

export function FamilyHeartsScreen({ navigate }: FamilyHeartsScreenProps) {
  const { heartEventTypes, heartEvents, rewardRedemptions, rewards, settings, addHeartEvent } = useAppData();
  const today = useToday();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);
  const todayTotal = getTodayHeartsTotal(heartEvents, today);
  const atCap = todayTotal >= settings.dailyHeartCap;
  const activeTypes = heartEventTypes.filter((t) => !t.archived);
  const recentEvents = [...heartEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  function handleConfirm(type: HeartEventType, note?: string) {
    const remaining = Math.max(0, settings.dailyHeartCap - todayTotal);
    const awarded = Math.min(type.hearts, remaining);
    setModalOpen(false);

    if (awarded <= 0) {
      setFeedback("הפעם לא הצלחנו להרוויח לב, ננסה שוב אחר כך.");
      return;
    }

    addHeartEvent({
      id: generateId(),
      heartEventTypeId: type.id,
      heartsAwarded: awarded,
      note,
      createdAt: new Date().toISOString(),
    });
    setFeedback(null);
  }

  return (
    <AppShell title="לבבות משפחתיים" onBack={() => navigate({ screen: "home" })}>
      <div className="family-hearts-screen">
        <section className="family-hearts-screen__summary">
          <HeartBadge value={current} label={`מתוך ${settings.familyHeartTarget}`} />
          <p className="family-hearts-screen__today">היום: {todayTotal} מתוך {settings.dailyHeartCap}</p>
        </section>

        {atCap && (
          <div className="family-hearts-screen__banner">הגענו למקסימום הלבבות היומי. הבית התחזק היום. 💗</div>
        )}
        {feedback && <div className="family-hearts-screen__banner family-hearts-screen__banner--muted">{feedback}</div>}

        <button type="button" className="btn btn--primary" onClick={() => setModalOpen(true)}>
          💗 הוספת לב משפחתי
        </button>

        {recentEvents.length > 0 && (
          <section>
            <h2 className="family-hearts-screen__section-title">אירועים אחרונים</h2>
            <ul className="family-hearts-screen__list">
              {recentEvents.map((event) => {
                const type = heartEventTypes.find((t) => t.id === event.heartEventTypeId);
                return (
                  <li key={event.id} className="family-hearts-screen__list-item">
                    <span>{type?.title ?? "סוג אירוע שהוסר"}</span>
                    <span className="family-hearts-screen__list-meta">
                      {"💗".repeat(event.heartsAwarded)} · {formatHebrewDateTime(event.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {modalOpen && (
        <LogHeartEventModal heartEventTypes={activeTypes} onConfirm={handleConfirm} onClose={() => setModalOpen(false)} />
      )}
    </AppShell>
  );
}
