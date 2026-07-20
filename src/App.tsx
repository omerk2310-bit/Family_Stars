import { useState } from "react";
import { AppDataProvider, useAppData } from "./state/AppDataContext";
import { useSession } from "./state/useSession";
import type { Route } from "./types/routes";
import { getActiveChildren } from "./storage/selectors";
import {
  clearStoredDeviceRole,
  getParentUnlocked,
  getStoredDeviceRole,
  parseDeepLinkRole,
  setParentUnlocked,
  setStoredDeviceRole,
  type DeviceRole,
} from "./state/deviceRole";
import { HomeScreen } from "./screens/HomeScreen";
import { FamilyHeartsScreen } from "./screens/FamilyHeartsScreen";
import { RedEventsScreen } from "./screens/RedEventsScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { WeeklySummaryScreen } from "./screens/WeeklySummaryScreen";
import { PendingApprovalsScreen } from "./screens/PendingApprovalsScreen";
import { InstantRewardsGrantsScreen } from "./screens/InstantRewardsGrantsScreen";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { RoleSelectorScreen } from "./screens/RoleSelectorScreen";
import { RestrictedChildScreen } from "./screens/RestrictedChildScreen";
import { InstantRewardsMigrationScreen } from "./screens/InstantRewardsMigrationScreen";
import { AppShell } from "./components/layout/AppShell";
import { BottomNav } from "./components/layout/BottomNav";

interface RouterProps {
  route: Route;
  setRoute: (route: Route) => void;
}

function Router({ route, setRoute }: RouterProps) {
  switch (route.screen) {
    case "home":
      return (
        <AppShell title="כוחות הבית" onSettings={() => setRoute({ screen: "settings" })}>
          <HomeScreen navigate={setRoute} />
        </AppShell>
      );
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
    case "pendingApprovals":
      return <PendingApprovalsScreen navigate={setRoute} />;
    case "instantRewardsGrants":
      return <InstantRewardsGrantsScreen navigate={setRoute} />;
    default:
      return null;
  }
}

function DeviceRoleGate() {
  const { children, settings } = useAppData();
  const [route, setRoute] = useState<Route>({ screen: "home" });
  const [role, setRole] = useState<DeviceRole>(() => {
    const deepLink = parseDeepLinkRole(window.location.search);
    if (deepLink) {
      setStoredDeviceRole(deepLink);
      return deepLink;
    }
    return getStoredDeviceRole();
  });
  const [parentUnlocked, setParentUnlockedState] = useState(getParentUnlocked);

  function selectChild(childId: string) {
    const next: DeviceRole = { kind: "child", childId };
    setStoredDeviceRole(next);
    setRole(next);
  }

  function authenticateParent() {
    setStoredDeviceRole({ kind: "parent" });
    setRole({ kind: "parent" });
    setParentUnlocked(true);
    setParentUnlockedState(true);
  }

  function resetDevice() {
    clearStoredDeviceRole();
    setParentUnlocked(false);
    setParentUnlockedState(false);
    setRole({ kind: "unset" });
  }

  if (role.kind === "child") {
    const stillActive = getActiveChildren(children).some((c) => c.id === role.childId);
    if (!stillActive) {
      return <RoleSelectorScreen onParentAuthenticated={authenticateParent} onSelectChild={selectChild} />;
    }
    return <RestrictedChildScreen childId={role.childId} onResetDevice={resetDevice} />;
  }

  if (role.kind === "parent") {
    if (!parentUnlocked) {
      return (
        <RoleSelectorScreen
          onParentAuthenticated={authenticateParent}
          onSelectChild={selectChild}
          startInPinMode
        />
      );
    }
    if (!settings.economyMigrationShown) {
      return <InstantRewardsMigrationScreen onDone={() => undefined} />;
    }
    return (
      <div className="device-role-gate__parent-wrapper">
        <Router route={route} setRoute={setRoute} />
        <button type="button" className="device-role-gate__switch-user" onClick={resetDevice}>
          🔄 החלפת משתמש
        </button>
        <BottomNav route={route} navigate={setRoute} />
      </div>
    );
  }

  return <RoleSelectorScreen onParentAuthenticated={authenticateParent} onSelectChild={selectChild} />;
}

export default function App() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <AppShell title="כוחות הבית">
        <p>טוען...</p>
      </AppShell>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <AppDataProvider>
      <DeviceRoleGate />
    </AppDataProvider>
  );
}
