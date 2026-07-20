import { CalendarDays, Gift, Home, Settings } from "lucide-react";
import type { Route } from "../../types/routes";
import "./BottomNav.css";

interface BottomNavProps {
  route: Route;
  navigate: (route: Route) => void;
}

const TABS: { screen: Route["screen"]; label: string; icon: typeof Home; route: Route }[] = [
  { screen: "home", label: "בית", icon: Home, route: { screen: "home" } },
  { screen: "rewards", label: "פרסים", icon: Gift, route: { screen: "rewards" } },
  { screen: "weeklySummary", label: "סיכום", icon: CalendarDays, route: { screen: "weeklySummary" } },
  { screen: "settings", label: "הגדרות", icon: Settings, route: { screen: "settings" } },
];

// Persistent primary navigation for the parent flow — a sibling of the
// Router, not nested inside each screen's own AppShell, so it stays fixed
// across every parent-facing screen. Only these 4 destinations are tabs;
// everything else (family hearts, red events, approvals inboxes) stays a
// regular in-page action/button, reached via Home or Settings.
export function BottomNav({ route, navigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = route.screen === tab.screen;
        return (
          <button
            key={tab.screen}
            type="button"
            className={`bottom-nav__tab ${active ? "bottom-nav__tab--active" : ""}`}
            onClick={() => navigate(tab.route)}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
