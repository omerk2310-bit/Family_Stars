import { useState } from "react";
import { AppDataProvider } from "./state/AppDataContext";
import type { Route } from "./types/routes";
import { HomeScreen } from "./screens/HomeScreen";
import { ChildScreen } from "./screens/ChildScreen";
import { FamilyHeartsScreen } from "./screens/FamilyHeartsScreen";
import { RedEventsScreen } from "./screens/RedEventsScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { WeeklySummaryScreen } from "./screens/WeeklySummaryScreen";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { AppShell } from "./components/layout/AppShell";

function Router() {
  const [route, setRoute] = useState<Route>({ screen: "home" });

  switch (route.screen) {
    case "home":
      return (
        <AppShell title="כוחות הבית" onSettings={() => setRoute({ screen: "settings" })}>
          <HomeScreen navigate={setRoute} />
        </AppShell>
      );
    case "child":
      return <ChildScreen childId={route.childId} navigate={setRoute} />;
    case "familyHearts":
      return <FamilyHeartsScreen navigate={setRoute} />;
    case "redEvents":
      return <RedEventsScreen navigate={setRoute} />;
    case "rewards":
      return <RewardsScreen navigate={setRoute} />;
    case "weeklySummary":
      return <WeeklySummaryScreen navigate={setRoute} />;
    case "settings":
      return <SettingsScreen initialTab={route.tab} navigate={setRoute} />;
    default:
      return null;
  }
}

export default function App() {
  return (
    <AppDataProvider>
      <Router />
    </AppDataProvider>
  );
}
