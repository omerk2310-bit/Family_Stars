import { useState } from "react";
import { isSoundMuted, setSoundMuted } from "./soundPrefs";

export function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted);

  function toggle() {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  }

  return (
    <label className="settings-form__row">
      <input type="checkbox" checked={muted} onChange={toggle} />
      השתקת צלילי תגמול (במכשיר הזה בלבד)
    </label>
  );
}
