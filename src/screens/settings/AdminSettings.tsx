import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Child } from "../../types/entities";
import { getActiveChildren, resolveChildName } from "../../storage/selectors";
import { generateId } from "../../utils/id";
import { formatHebrewDateTime } from "../../utils/format";

const PIN_LENGTH = 4;

function isValidPin(value: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(value);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, PIN_LENGTH);
}

export function AdminSettings() {
  const { children, starAdjustments, settings, updateSettings, addStarAdjustment } = useAppData();
  const [unlocked, setUnlocked] = useState(false);

  const activeChildren = getActiveChildren(children);
  const recentAdjustments = [...starAdjustments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  if (!settings.adminPin) {
    return (
      <SetupPinForm
        onSaved={(pin) => {
          updateSettings({ ...settings, adminPin: pin });
          setUnlocked(true);
        }}
      />
    );
  }

  if (!unlocked) {
    return <UnlockForm expectedPin={settings.adminPin} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="settings-form">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ width: "auto" }}
          onClick={() => setUnlocked(false)}
        >
          🔒 נעילה
        </button>
      </div>

      <AdjustmentTool
        children={activeChildren}
        onApply={(childId, delta, note) => {
          addStarAdjustment({ id: generateId(), childId, delta, note, createdAt: new Date().toISOString() });
        }}
      />

      {recentAdjustments.length > 0 && (
        <section>
          <p className="settings-form__hint" style={{ fontWeight: 700, marginBottom: 8 }}>
            שינויים אחרונים
          </p>
          <ul className="admin-settings__list">
            {recentAdjustments.map((adjustment) => (
              <li key={adjustment.id} className="admin-settings__list-item">
                <div>
                  <p style={{ fontWeight: 700 }}>{resolveChildName(adjustment.childId, children)}</p>
                  <p className="admin-settings__list-meta">
                    {adjustment.note ? `${adjustment.note} · ` : ""}
                    {formatHebrewDateTime(adjustment.createdAt)}
                  </p>
                </div>
                <span
                  className={
                    adjustment.delta >= 0 ? "admin-settings__delta--positive" : "admin-settings__delta--negative"
                  }
                >
                  {adjustment.delta >= 0 ? `+${adjustment.delta}` : adjustment.delta} ⭐
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SetupPinForm({ onSaved }: { onSaved: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!isValidPin(pin)) {
      setError("הקוד חייב להיות בדיוק 4 ספרות.");
      return;
    }
    if (pin !== confirmPin) {
      setError("הקודים לא תואמים.");
      return;
    }
    setError(null);
    onSaved(pin);
  }

  return (
    <div className="settings-form">
      <p className="settings-form__hint">
        הגדירו קוד בן 4 ספרות לגישה לאזור הניהול. שמרו אותו במקום בטוח — אין דרך לשחזר אותו מתוך האפליקציה.
      </p>
      <div className="form-field">
        <label htmlFor="admin-pin-new">קוד חדש</label>
        <input
          id="admin-pin-new"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={(e) => setPin(digitsOnly(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="admin-pin-confirm">אימות קוד</label>
        <input
          id="admin-pin-confirm"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={confirmPin}
          onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
        />
      </div>
      {error && <p className="redeem-reward__warning">{error}</p>}
      <button type="button" className="btn btn--primary" onClick={handleSave}>
        שמירת קוד
      </button>
    </div>
  );
}

function UnlockForm({ expectedPin, onUnlock }: { expectedPin: string; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (pin === expectedPin) {
      setError(null);
      onUnlock();
    } else {
      setError("קוד שגוי, נסו שוב.");
      setPin("");
    }
  }

  return (
    <div className="settings-form">
      <p className="settings-form__hint">אזור זה מיועד להורים בלבד. הזינו את קוד הניהול כדי להמשיך.</p>
      <div className="form-field">
        <label htmlFor="admin-pin-unlock">קוד ניהול</label>
        <input
          id="admin-pin-unlock"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={(e) => setPin(digitsOnly(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      {error && <p className="redeem-reward__warning">{error}</p>}
      <button type="button" className="btn btn--primary" onClick={handleSubmit}>
        אישור
      </button>
    </div>
  );
}

interface AdjustmentToolProps {
  children: Child[];
  onApply: (childId: string, delta: number, note?: string) => void;
}

function AdjustmentTool({ children, onApply }: AdjustmentToolProps) {
  const [childId, setChildId] = useState(children.length === 1 ? children[0].id : "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const delta = Number(amount);
  const canApply = childId !== "" && amount.trim() !== "" && !Number.isNaN(delta) && delta !== 0;

  function handleApply() {
    if (!canApply) return;
    onApply(childId, delta, note.trim() || undefined);
    setAmount("");
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <p className="settings-form__hint">
        שינוי ידני בכוכבים של ילדה — לא כפוף לתקרה היומית ואינו קשור להתנהגות מסוימת. אפשר להזין מספר שלילי כדי
        להחסיר.
      </p>
      <div className="form-field">
        <label htmlFor="admin-adjust-child">עבור מי?</label>
        <select id="admin-adjust-child" value={childId} onChange={(e) => setChildId(e.target.value)}>
          <option value="" disabled>
            בחרו ילדה
          </option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="admin-adjust-amount">כמות (חיובי או שלילי)</label>
        <input
          id="admin-adjust-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="לדוגמה: 5 או ‎-3"
        />
      </div>
      <div className="form-field">
        <label htmlFor="admin-adjust-note">הערה (לא חובה)</label>
        <textarea id="admin-adjust-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <button type="button" className="btn btn--primary" disabled={!canApply} onClick={handleApply}>
        {saved ? "בוצע ✓" : "החלה"}
      </button>
    </div>
  );
}
