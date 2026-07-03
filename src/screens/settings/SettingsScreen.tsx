import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Route, SettingsTab } from "../../types/routes";
import { AppShell } from "../../components/layout/AppShell";
import { ChildrenSettings } from "./ChildrenSettings";
import { BehaviorsSettings } from "./BehaviorsSettings";
import { HeartTypesSettings } from "./HeartTypesSettings";
import { RedTypesSettings } from "./RedTypesSettings";
import { RewardsSettings } from "./RewardsSettings";
import { GlobalSettingsForm } from "./GlobalSettingsForm";
import { DataManagementSettings } from "./DataManagementSettings";
import { AdminSettings, SetupPinForm, UnlockForm } from "./AdminSettings";
import "./SettingsScreen.css";

interface SettingsScreenProps {
  initialTab?: SettingsTab;
  navigate: (route: Route) => void;
}

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "children", label: "ילדים" },
  { id: "behaviors", label: "התנהגויות" },
  { id: "heartTypes", label: "לבבות" },
  { id: "redTypes", label: "אירועים אדומים" },
  { id: "rewards", label: "פרסים" },
  { id: "global", label: "הגדרות כלליות" },
  { id: "data", label: "ניהול נתונים" },
  { id: "admin", label: "עריכת כוכבים" },
];

export function SettingsScreen({ initialTab, navigate }: SettingsScreenProps) {
  const { settings, updateSettings } = useAppData();
  const [tab, setTab] = useState<SettingsTab>(initialTab ?? "children");
  const [unlocked, setUnlocked] = useState(false);

  if (!settings.adminPin) {
    return (
      <AppShell title="הגדרת קוד אבטחה" onBack={() => navigate({ screen: "home" })}>
        <SetupPinForm
          onSaved={(pin) => {
            updateSettings({ ...settings, adminPin: pin });
            setUnlocked(true);
          }}
        />
      </AppShell>
    );
  }

  if (!unlocked) {
    return (
      <AppShell title="הגדרות" onBack={() => navigate({ screen: "home" })}>
        <UnlockForm expectedPin={settings.adminPin} onUnlock={() => setUnlocked(true)} />
      </AppShell>
    );
  }

  return (
    <AppShell title="הגדרות" onBack={() => navigate({ screen: "home" })}>
      <div className="settings-screen">
        <nav className="settings-screen__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-screen__tab ${tab === t.id ? "settings-screen__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="settings-screen__content">
          {tab === "children" && <ChildrenSettings />}
          {tab === "behaviors" && <BehaviorsSettings />}
          {tab === "heartTypes" && <HeartTypesSettings />}
          {tab === "redTypes" && <RedTypesSettings />}
          {tab === "rewards" && <RewardsSettings />}
          {tab === "global" && <GlobalSettingsForm />}
          {tab === "data" && <DataManagementSettings />}
          {tab === "admin" && <AdminSettings onLock={() => setUnlocked(false)} />}
        </div>
      </div>
    </AppShell>
  );
}
