import { useState } from "react";
import type { Route, SettingsTab } from "../../types/routes";
import { AppShell } from "../../components/layout/AppShell";
import { ChildrenSettings } from "./ChildrenSettings";
import { BehaviorsSettings } from "./BehaviorsSettings";
import { HeartTypesSettings } from "./HeartTypesSettings";
import { RedTypesSettings } from "./RedTypesSettings";
import { RewardsSettings } from "./RewardsSettings";
import { EconomySettings } from "./EconomySettings";
import { GlobalSettingsForm } from "./GlobalSettingsForm";
import { DataManagementSettings } from "./DataManagementSettings";
import { AdminSettings } from "./AdminSettings";
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
  { id: "economy", label: "כלכלה" },
  { id: "global", label: "הגדרות כלליות" },
  { id: "data", label: "ניהול נתונים" },
  { id: "admin", label: "עריכת כוכבים" },
];

export function SettingsScreen({ initialTab, navigate }: SettingsScreenProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab ?? "children");

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
          {tab === "economy" && <EconomySettings />}
          {tab === "global" && <GlobalSettingsForm />}
          {tab === "data" && <DataManagementSettings />}
          {tab === "admin" && <AdminSettings />}
        </div>
      </div>
    </AppShell>
  );
}
