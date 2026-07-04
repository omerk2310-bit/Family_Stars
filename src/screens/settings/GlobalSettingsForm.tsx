import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import { parseIntOrFallback, stripNonDigits } from "../../utils/numericInput";

export function GlobalSettingsForm() {
  const { settings, updateSettings } = useAppData();
  const [dailyStarCap, setDailyStarCap] = useState(String(settings.dailyStarCap));
  const [dailyHeartCap, setDailyHeartCap] = useState(String(settings.dailyHeartCap));
  const [familyHeartTarget, setFamilyHeartTarget] = useState(String(settings.familyHeartTarget));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const clampedStarCap = Math.max(1, parseIntOrFallback(dailyStarCap, settings.dailyStarCap));
    const clampedHeartCap = Math.max(1, parseIntOrFallback(dailyHeartCap, settings.dailyHeartCap));
    const clampedHeartTarget = Math.max(1, parseIntOrFallback(familyHeartTarget, settings.familyHeartTarget));
    updateSettings({
      dailyStarCap: clampedStarCap,
      dailyHeartCap: clampedHeartCap,
      familyHeartTarget: clampedHeartTarget,
    });
    setDailyStarCap(String(clampedStarCap));
    setDailyHeartCap(String(clampedHeartCap));
    setFamilyHeartTarget(String(clampedHeartTarget));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <div className="form-field">
        <label htmlFor="daily-star-cap">מקסימום כוכבים ליום (לכל ילדה)</label>
        <input
          id="daily-star-cap"
          type="text"
          inputMode="numeric"
          value={dailyStarCap}
          onChange={(e) => setDailyStarCap(stripNonDigits(e.target.value))}
        />
      </div>
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
    </div>
  );
}
