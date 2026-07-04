import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { getActiveChildren } from "../storage/selectors";
import { AppShell } from "../components/layout/AppShell";
import { ChildAvatar } from "../components/shared/ChildAvatar";
import { SetupPinForm, UnlockForm } from "./settings/AdminSettings";
import "./RoleSelectorScreen.css";

interface RoleSelectorScreenProps {
  onParentAuthenticated: () => void;
  onSelectChild: (childId: string) => void;
  startInPinMode?: boolean;
}

export function RoleSelectorScreen({ onParentAuthenticated, onSelectChild, startInPinMode }: RoleSelectorScreenProps) {
  const { children, settings, updateSettings } = useAppData();
  const [enteringParentPin, setEnteringParentPin] = useState(startInPinMode ?? false);
  const activeChildren = getActiveChildren(children);

  if (enteringParentPin) {
    return (
      <AppShell title="כניסת הורה">
        {settings.adminPin ? (
          <UnlockForm expectedPin={settings.adminPin} onUnlock={onParentAuthenticated} />
        ) : (
          <SetupPinForm
            onSaved={(pin) => {
              updateSettings({ ...settings, adminPin: pin });
              onParentAuthenticated();
            }}
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell title="מי משתמש עכשיו?">
      <div className="role-selector">
        <button
          type="button"
          className="role-selector__card role-selector__card--parent"
          onClick={() => setEnteringParentPin(true)}
        >
          <span className="role-selector__icon">🔒</span>
          <span className="role-selector__label">הורה/הורים</span>
        </button>
        {activeChildren.map((child) => (
          <button key={child.id} type="button" className="role-selector__card" onClick={() => onSelectChild(child.id)}>
            <ChildAvatar icon={child.icon} color={child.color} size="lg" />
            <span className="role-selector__label">{child.displayName}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
