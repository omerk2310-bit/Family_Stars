import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Child } from "../../types/entities";
import { getActiveChildren, resolveChildName } from "../../storage/selectors";
import { generateId } from "../../utils/id";
import { formatHebrewDateTime } from "../../utils/format";
import { stripNonDigits } from "../../utils/numericInput";

const PIN_LENGTH = 4;

function isValidPin(value: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(value);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, PIN_LENGTH);
}

const ADMIN_CORRECTION_BEHAVIOR_ID = "admin-correction";

export function AdminSettings() {
  const { children, starEvents, settings, updateSettings, addStarEvent } = useAppData();
  const [changingPin, setChangingPin] = useState(false);

  const activeChildren = getActiveChildren(children);
  const recentAdjustments = starEvents
    .filter((e) => e.behaviorId === ADMIN_CORRECTION_BEHAVIOR_ID)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return (
    <div className="settings-form">
      <button
        type="button"
        className="btn btn--secondary"
        style={{ width: "auto" }}
        onClick={() => setChangingPin((v) => !v)}
      >
        {changingPin ? "ביטול" : "שינוי קוד"}
      </button>

      {changingPin && (
        <ChangePinForm
          currentPin={settings.adminPin ?? ""}
          onSaved={(pin) => {
            updateSettings({ ...settings, adminPin: pin });
            setChangingPin(false);
          }}
        />
      )}

      <AdjustmentTool
        children={activeChildren}
        onApply={(childId, amount, note) => {
          addStarEvent({
            id: generateId(),
            childId,
            behaviorId: ADMIN_CORRECTION_BEHAVIOR_ID,
            pointsAwarded: amount,
            note,
            createdAt: new Date().toISOString(),
            isGoldStar: false,
          });
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
                <span className="admin-settings__delta--positive">+{adjustment.pointsAwarded} ⭐</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function SetupPinForm({ onSaved }: { onSaved: (pin: string) => void }) {
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
        זו הכניסה הראשונה להגדרות. הגדירו קוד בן 4 ספרות שיידרש בכל כניסה להגדרות האפליקציה. שמרו אותו במקום בטוח —
        אין דרך לשחזר אותו מתוך האפליקציה, אבל אפשר לשנות אותו מאוחר יותר בלשונית "עריכת כוכבים".
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

function ChangePinForm({ currentPin, onSaved }: { currentPin: string; onSaved: (pin: string) => void }) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (oldPin !== currentPin) {
      setError("הקוד הנוכחי שגוי.");
      return;
    }
    if (!isValidPin(newPin)) {
      setError("הקוד החדש חייב להיות בדיוק 4 ספרות.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("הקודים החדשים לא תואמים.");
      return;
    }
    setError(null);
    onSaved(newPin);
  }

  return (
    <div className="settings-form">
      <div className="form-field">
        <label htmlFor="admin-pin-old">קוד נוכחי</label>
        <input
          id="admin-pin-old"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={oldPin}
          onChange={(e) => setOldPin(digitsOnly(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="admin-pin-change-new">קוד חדש</label>
        <input
          id="admin-pin-change-new"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={newPin}
          onChange={(e) => setNewPin(digitsOnly(e.target.value))}
        />
      </div>
      <div className="form-field">
        <label htmlFor="admin-pin-change-confirm">אימות קוד חדש</label>
        <input
          id="admin-pin-change-confirm"
          type="password"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={confirmPin}
          onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
        />
      </div>
      {error && <p className="redeem-reward__warning">{error}</p>}
      <button type="button" className="btn btn--primary" onClick={handleSave}>
        עדכון קוד
      </button>
    </div>
  );
}

export function UnlockForm({ expectedPin, onUnlock }: { expectedPin: string; onUnlock: () => void }) {
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
      <p className="settings-form__hint">אזור ההגדרות מיועד להורים בלבד. הזינו את קוד הניהול כדי להמשיך.</p>
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
  onApply: (childId: string, amount: number, note?: string) => void;
}

function AdjustmentTool({ children, onApply }: AdjustmentToolProps) {
  const [childId, setChildId] = useState(children.length === 1 ? children[0].id : "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const magnitude = Number(amount);
  const canApply = childId !== "" && amount.trim() !== "" && !Number.isNaN(magnitude) && magnitude > 0;

  function handleApply() {
    if (!canApply) return;
    onApply(childId, magnitude, note.trim() || undefined);
    setAmount("");
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <p className="settings-form__hint">
        תיקון ידני בכוכבים של ילדה — נוסף מיידית כארד, לא כפוף ליעד היומי ואינו קשור להתנהגות מסוימת. תיקוני אדמין הם
        תמיד תוספת חיובית, אף פעם לא הפחתה.
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
        <label htmlFor="admin-adjust-amount">כמות</label>
        <input
          id="admin-adjust-amount"
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(stripNonDigits(e.target.value))}
          placeholder="לדוגמה: 5"
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
