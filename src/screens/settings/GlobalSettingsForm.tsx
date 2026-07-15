import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import { parseIntOrFallback, stripNonDigits } from "../../utils/numericInput";
import { PushOptIn } from "../../notifications/PushOptIn";

// Daily star cap is retired here — the bronze tier's target (Settings ->
// כלכלה) replaces its role, and unlike the old cap it's a target, not a
// ceiling.
export function GlobalSettingsForm() {
  const { settings, updateSettings } = useAppData();
  const [dailyHeartCap, setDailyHeartCap] = useState(String(settings.dailyHeartCap));
  const [familyHeartTarget, setFamilyHeartTarget] = useState(String(settings.familyHeartTarget));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const clampedHeartCap = Math.max(1, parseIntOrFallback(dailyHeartCap, settings.dailyHeartCap));
    const clampedHeartTarget = Math.max(1, parseIntOrFallback(familyHeartTarget, settings.familyHeartTarget));
    updateSettings({
      ...settings,
      dailyHeartCap: clampedHeartCap,
      familyHeartTarget: clampedHeartTarget,
    });
    setDailyHeartCap(String(clampedHeartCap));
    setFamilyHeartTarget(String(clampedHeartTarget));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <div className="form-field">
        <label htmlFor="daily-heart-cap">מקסימום לבבות ליום (למשפחה)</label>
        <input
          id="daily-heart-cap"
          type="text"
          inputMode="numeric"
          value={dailyHeartCap}
          onChange={(e) => setDailyHeartCap(stripNonDigits(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="family-heart-target">יעד לבבות לפרס משפחתי</label>
        <input
          id="family-heart-target"
          type="text"
          inputMode="numeric"
          value={familyHeartTarget}
          onChange={(e) => setFamilyHeartTarget(stripNonDigits(e.target.value))}
        />
      </div>
      <button type="button" className="btn btn--primary" onClick={handleSave}>
        {saved ? "נשמר ✓" : "שמירת הגדרות"}
      </button>

      <section style={{ marginTop: "var(--space-4)" }}>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>התראות למכשיר זה</p>
        <p className="settings-form__hint">
          קבלו התראה כשילד/ה מבקשים אישור לפרס, גם כשההגדרות סגורות.
        </p>
        <PushOptIn role="parent" />
      </section>
    </div>
  );
}
