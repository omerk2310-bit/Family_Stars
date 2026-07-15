import { useEffect, useState } from "react";
import { getPushStatus, requestAndSubscribe, type PushRole, type PushSupportStatus } from "./push";

interface PushOptInProps {
  role: PushRole;
  childId?: string;
}

// Small opt-in control for background push — shown on the child's own screen
// and on the parent side (see RestrictedChildScreen.tsx / SettingsScreen's
// global tab). Silently renders nothing when the platform can't support Web
// Push at all, since there's no useful action to offer there.
export function PushOptIn({ role, childId }: PushOptInProps) {
  const [status, setStatus] = useState<PushSupportStatus | "loading">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushStatus()
      .then(setStatus)
      .catch(() => setStatus("unsupported"));
  }, []);

  if (status === "loading" || status === "unsupported") return null;

  if (status === "subscribed") {
    return <p className="settings-form__hint">🔔 התראות פעילות במכשיר זה.</p>;
  }

  if (status === "denied") {
    return (
      <p className="settings-form__hint">
        התראות נחסמו עבור האתר הזה בדפדפן. כדי להפעיל, יש לאשר התראות בהגדרות הדפדפן ולרענן.
      </p>
    );
  }

  async function handleEnable() {
    try {
      await requestAndSubscribe(role, childId);
      setStatus("subscribed");
      setError(null);
    } catch {
      setError("לא הצלחנו להפעיל התראות. ודאו שאישרתם את הבקשה בדפדפן.");
    }
  }

  return (
    <div>
      <button type="button" className="btn btn--secondary" style={{ width: "auto" }} onClick={handleEnable}>
        🔔 הפעלת התראות
      </button>
      <p className="settings-form__hint">
        קבלו התראה גם כשהאפליקציה סגורה. באייפון יש להוסיף קודם את האפליקציה למסך הבית (שיתוף ← הוספה למסך הבית) —
        התראות לא עובדות בטאב רגיל של Safari.
      </p>
      {error && <p className="redeem-reward__warning">{error}</p>}
    </div>
  );
}
