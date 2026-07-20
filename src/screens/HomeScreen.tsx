import { ClipboardList, Gift, Heart, Shield } from "lucide-react";
import { useAppData } from "../state/AppDataContext";
import { useToday } from "../hooks/useToday";
import type { Route } from "../types/routes";
import { getActiveChildren, getFamilyHeartsCurrent, getPendingRewardRedemptions, getPendingStarEvents } from "../storage/selectors";
import { getEconomyStateForChild, getGrantsForChild } from "../economy/economySelectors";
import { formatHebrewDate } from "../utils/format";
import { ChildCard } from "../components/shared/ChildCard";
import { HeartBadge } from "../components/shared/HeartBadge";
import { EmptyState } from "../components/layout/EmptyState";
import "./HomeScreen.css";

interface HomeScreenProps {
  navigate: (route: Route) => void;
}

export function HomeScreen({ navigate }: HomeScreenProps) {
  const { children, starEvents, heartEvents, rewardRedemptions, rewards, rewardClaims, legacyGrants, settings } = useAppData();
  const today = useToday();

  const activeChildren = getActiveChildren(children);
  const familyHeartsCurrent = getFamilyHeartsCurrent(heartEvents, rewardRedemptions, rewards);
  const pendingCount = getPendingRewardRedemptions(rewardRedemptions).length + getPendingStarEvents(starEvents).length;

  const now = new Date();
  const pendingGrantsCount =
    activeChildren.reduce(
      (sum, child) =>
        sum +
        getGrantsForChild(
          child.id,
          starEvents,
          settings.economyStartsAt,
          settings.economyConfig,
          rewardClaims,
          now,
          child.starsResetAt
        ).filter((g) => g.claimedAt === null).length,
      0
    ) + legacyGrants.filter((g) => !g.claimedAt).length;

  return (
    <div className="home-screen">
      <p className="home-screen__date">{formatHebrewDate(today)}</p>

      <section className="home-screen__hearts-card">
        <div>
          <p className="home-screen__hearts-title">לבבות משפחתיים</p>
          <p className="home-screen__hearts-sub">
            {familyHeartsCurrent} מתוך {settings.familyHeartTarget}
          </p>
        </div>
        <HeartBadge value={familyHeartsCurrent} />
      </section>

      <button
        type="button"
        className={`btn ${pendingCount > 0 ? "btn--amber" : "btn--secondary"} home-screen__approvals-btn`}
        onClick={() => navigate({ screen: "pendingApprovals" })}
      >
        <ClipboardList size={18} /> בקשות ממתינות{pendingCount > 0 ? ` (${pendingCount})` : ""}
      </button>

      <button
        type="button"
        className={`btn ${pendingGrantsCount > 0 ? "btn--amber" : "btn--secondary"} home-screen__approvals-btn`}
        onClick={() => navigate({ screen: "instantRewardsGrants" })}
      >
        <Gift size={18} /> מתנות לחלוקה{pendingGrantsCount > 0 ? ` (${pendingGrantsCount})` : ""}
      </button>

      <section className="home-screen__actions">
        <button type="button" className="btn btn--secondary" onClick={() => navigate({ screen: "familyHearts" })}>
          <Heart size={18} /> הוספת לב משפחתי
        </button>
        <button type="button" className="btn btn--amber" onClick={() => navigate({ screen: "redEvents" })}>
          <Shield size={18} /> רישום אירוע אדום
        </button>
      </section>

      <section className="home-screen__children">
        <h2 className="home-screen__section-title">הילדים שלנו</h2>
        {activeChildren.length === 0 ? (
          <EmptyState
            icon="🌟"
            title="עוד לא הוספתם ילדים"
            message="אפשר להוסיף ילדה חדשה במסך ההגדרות, ואז היא תופיע כאן עם המסך האישי שלה."
            action={
              <button type="button" className="btn btn--primary" onClick={() => navigate({ screen: "settings", tab: "children" })}>
                מעבר להגדרות
              </button>
            }
          />
        ) : (
          <div className="home-screen__children-grid">
            {activeChildren.map((child) => {
              const state = getEconomyStateForChild(
                child.id,
                starEvents,
                settings.economyStartsAt,
                settings.economyConfig,
                now,
                child.starsResetAt
              );
              return <ChildCard key={child.id} child={child} config={settings.economyConfig} state={state} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
