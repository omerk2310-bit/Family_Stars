import { useRef, useState, type ChangeEvent } from "react";
import { useAppData } from "../../state/AppDataContext";
import { validateImport } from "../../storage/exportImport";
import { supabase } from "../../storage/supabaseClient";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

interface PendingImport {
  json: unknown;
  warnings: string[];
}

export function DataManagementSettings() {
  const { exportData, importData, resetAllData } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        const result = validateImport(json);
        if (!result.valid) {
          setMessage(`הקובץ לא תקין:\n${result.errors.join("\n")}`);
          return;
        }
        setPendingImport({ json, warnings: result.warnings });
      } catch {
        setMessage("לא הצלחנו לקרוא את הקובץ. ודאו שזהו קובץ JSON תקין.");
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pendingImport) return;
    const result = importData(pendingImport.json);
    setPendingImport(null);
    setMessage(result.valid ? "הנתונים יובאו בהצלחה." : "הייבוא נכשל.");
  }

  return (
    <div className="settings-form">
      <div>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>גיבוי ושחזור</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" className="btn btn--secondary" onClick={exportData}>
            ייצוא נתונים (JSON)
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => fileInputRef.current?.click()}>
            ייבוא נתונים
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
        </div>
        <p className="settings-form__hint">ייבוא נתונים יחליף את כל הנתונים הקיימים באפליקציה.</p>
      </div>

      {message && <p className="settings-form__hint" style={{ whiteSpace: "pre-line" }}>{message}</p>}

      <div>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>איפוס</p>
        <button type="button" className="btn btn--danger" onClick={() => setResetting(true)}>
          איפוס כל הנתונים
        </button>
      </div>

      <div>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>חשבון</p>
        <button type="button" className="btn btn--secondary" onClick={() => supabase.auth.signOut()}>
          התנתקות
        </button>
      </div>

      {pendingImport && (
        <ConfirmDialog
          title="ייבוא נתונים"
          message={
            pendingImport.warnings.length > 0
              ? `פעולה זו תחליף את כל הנתונים הקיימים. שימו לב:\n${pendingImport.warnings.join("\n")}`
              : "פעולה זו תחליף את כל הנתונים הקיימים באפליקציה. להמשיך?"
          }
          confirmLabel="ייבוא והחלפה"
          danger
          onCancel={() => setPendingImport(null)}
          onConfirm={confirmImport}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title="איפוס כל הנתונים"
          message="פעולה זו תמחק את כל הילדים, ההתנהגויות, האירועים והפרסים, ותחזיר את האפליקציה למצב ההתחלתי. לא ניתן לבטל פעולה זו."
          confirmLabel="איפוס"
          danger
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            resetAllData();
            setResetting(false);
            setMessage("כל הנתונים אופסו.");
          }}
        />
      )}
    </div>
  );
}
