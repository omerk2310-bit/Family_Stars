import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { supabase } from "../storage/supabaseClient";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("יש למלא אימייל וסיסמה.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError("אימייל או סיסמה שגויים.");
    }
  }

  return (
    <AppShell title="כוחות הבית">
      <div className="settings-form">
        <p className="settings-form__hint">התחברות עם חשבון המשפחה המשותף כדי להמשיך.</p>
        <div className="form-field">
          <label htmlFor="auth-email">אימייל</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div className="form-field">
          <label htmlFor="auth-password">סיסמה</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        {error && <p className="redeem-reward__warning">{error}</p>}
        <button type="button" className="btn btn--primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "מתחברים..." : "התחברות"}
        </button>
      </div>
    </AppShell>
  );
}
