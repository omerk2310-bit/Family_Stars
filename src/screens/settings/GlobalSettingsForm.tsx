import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";

export function GlobalSettingsForm() {
  const { settings, updateSettings } = useAppData();
  const [dailyStarCap, setDailyStarCap] = useState(settings.dailyStarCap);
  const [dailyHeartCap, setDailyHeartCap] = useState(settings.dailyHeartCap);
  const [familyHeartTarget, setFamilyHeartTarget] = useState(settings.familyHeartTarget);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateSettings({
      dailyStarCap: Math.max(1, dailyStarCap),
      dailyHeartCap: Math.max(1, dailyHeartCap),
      familyHeartTarget: Math.max(1, familyHeartTarget),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <div className="form-field">
        <label htmlFor="daily-star-cap">מקסימום כוכבים ליום (לכל ילדה)</label>
        <input
          id="daily-star-cap"
          type="number"
          min={1}
          value={dailyStarCap}
          onChange={(e) => setDailyStarCap(Number(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="daily-heart-cap">מקסימום לבבות ליום (למשפחה)</label>
        <input
          id="daily-heart-cap"
          type="number"
          min={1}
          value={dailyHeartCap}
          onChange={(e) => setDailyHeartCap(Number(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="family-heart-target">יעד לבבות לפרס משפחתי</label>
        <input
          id="family-heart-target"
          type="number"
          min={1}
          value={familyHeartTarget}
          onChange={(e) => setFamilyHeartTarget(Number(e.target.value))}
        />
      </div>
      <button type="button" className="btn btn--primary" onClick={handleSave}>
        {saved ? "נשמר ✓" : "שמירת הגדרות"}
      </button>
    </div>
  );
}
