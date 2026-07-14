import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import { parseIntOrFallback, stripNonDigits } from "../../utils/numericInput";
import { SoundToggle } from "../../economy/SoundToggle";
import type { WindowKind } from "../../economy/types";
import type { RewardDefinition } from "../../types/entities";

const WINDOW_LABELS: Record<WindowKind, string> = { daily: "יומי", weekly: "שבועי", monthly: "חודשי" };
const WEEKDAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function EconomySettings() {
  const { settings, updateSettings, rewardDefinitions, updateRewardDefinition } = useAppData();
  const { economyConfig } = settings;
  const sortedTiers = [...economyConfig.tiers].sort((a, b) => a.order - b.order);

  const [labels, setLabels] = useState(() => Object.fromEntries(sortedTiers.map((t) => [t.id, t.label])));
  const [targets, setTargets] = useState(() => Object.fromEntries(sortedTiers.map((t) => [t.id, String(t.target)])));
  const [rates, setRates] = useState(() =>
    Object.fromEntries(sortedTiers.map((t) => [t.id, t.source.type === "convert" ? String(t.source.rate) : ""]))
  );
  const [windows, setWindows] = useState(() => Object.fromEntries(sortedTiers.map((t) => [t.id, t.window])));
  const [capped, setCapped] = useState(() => Object.fromEntries(sortedTiers.map((t) => [t.id, t.capped])));
  const [dailyAt, setDailyAt] = useState(economyConfig.resets.dailyAt);
  const [weekStartsOn, setWeekStartsOn] = useState(economyConfig.resets.weekStartsOn);
  const [monthStartsOnDay, setMonthStartsOnDay] = useState(String(economyConfig.resets.monthStartsOnDay));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const nextTiers = sortedTiers.map((tier) => ({
      ...tier,
      label: labels[tier.id]?.trim() || tier.label,
      target: Math.max(1, parseIntOrFallback(targets[tier.id], tier.target)),
      window: (windows[tier.id] as WindowKind) ?? tier.window,
      capped: capped[tier.id] ?? tier.capped,
      source:
        tier.source.type === "convert"
          ? { ...tier.source, rate: Math.max(1, parseIntOrFallback(rates[tier.id], tier.source.rate)) }
          : tier.source,
    }));
    const clampedMonthDay = Math.min(31, Math.max(1, parseIntOrFallback(monthStartsOnDay, economyConfig.resets.monthStartsOnDay)));
    updateSettings({
      ...settings,
      economyConfig: {
        tiers: nextTiers,
        resets: { dailyAt, weekStartsOn, monthStartsOnDay: clampedMonthDay },
      },
    });
    setMonthStartsOnDay(String(clampedMonthDay));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-form">
      <p className="settings-form__hint">
        כאן אפשר לשנות את היעדים, יחסי ההמרה בין השכבות, וזמני האיפוס של כלכלת התגמול המיידי. שינויים חלים מהרגע
        שנשמרים, קדימה בלבד — ההיסטוריה הקיימת לא משתנה.
      </p>

      {sortedTiers.map((tier) => (
        <section key={tier.id} className="economy-settings__tier">
          <p style={{ fontWeight: 700 }}>
            {tier.icon} {tier.label}
          </p>
          <div className="form-field">
            <label htmlFor={`economy-label-${tier.id}`}>שם השכבה</label>
            <input
              id={`economy-label-${tier.id}`}
              value={labels[tier.id] ?? ""}
              onChange={(e) => setLabels((prev) => ({ ...prev, [tier.id]: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`economy-target-${tier.id}`}>יעד</label>
            <input
              id={`economy-target-${tier.id}`}
              type="text"
              inputMode="numeric"
              value={targets[tier.id] ?? ""}
              onChange={(e) => setTargets((prev) => ({ ...prev, [tier.id]: stripNonDigits(e.target.value) }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`economy-window-${tier.id}`}>חלון צבירה</label>
            <select
              id={`economy-window-${tier.id}`}
              value={windows[tier.id]}
              onChange={(e) => setWindows((prev) => ({ ...prev, [tier.id]: e.target.value as WindowKind }))}
            >
              {(Object.keys(WINDOW_LABELS) as WindowKind[]).map((w) => (
                <option key={w} value={w}>
                  {WINDOW_LABELS[w]}
                </option>
              ))}
            </select>
          </div>
          {tier.source.type === "behavior" && (
            <label className="settings-form__row">
              <input
                type="checkbox"
                checked={capped[tier.id] ?? false}
                onChange={(e) => setCapped((prev) => ({ ...prev, [tier.id]: e.target.checked }))}
              />
              היעד הוא גם תקרה (לא ניתן לעבור אותו באותו חלון)
            </label>
          )}
          {tier.source.type === "convert" && (
            <div className="form-field">
              <label htmlFor={`economy-rate-${tier.id}`}>
                יחס המרה (כמה {tier.source.from === "bronze" ? "ארד" : "כסף"} לכל יחידה)
              </label>
              <input
                id={`economy-rate-${tier.id}`}
                type="text"
                inputMode="numeric"
                value={rates[tier.id] ?? ""}
                onChange={(e) => setRates((prev) => ({ ...prev, [tier.id]: stripNonDigits(e.target.value) }))}
              />
            </div>
          )}
        </section>
      ))}

      <section className="economy-settings__tier">
        <p style={{ fontWeight: 700 }}>זמני איפוס</p>
        <div className="form-field">
          <label htmlFor="economy-daily-at">שעת איפוס יומית</label>
          <input id="economy-daily-at" type="time" value={dailyAt} onChange={(e) => setDailyAt(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="economy-week-start">יום תחילת השבוע</label>
          <select id="economy-week-start" value={weekStartsOn} onChange={(e) => setWeekStartsOn(Number(e.target.value))}>
            {WEEKDAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="economy-month-start">יום תחילת החודש</label>
          <input
            id="economy-month-start"
            type="text"
            inputMode="numeric"
            value={monthStartsOnDay}
            onChange={(e) => setMonthStartsOnDay(stripNonDigits(e.target.value))}
          />
        </div>
      </section>

      <button type="button" className="btn btn--primary" onClick={handleSave}>
        {saved ? "נשמר ✓" : "שמירת הגדרות כלכלה"}
      </button>

      <section className="economy-settings__tier">
        <p style={{ fontWeight: 700 }}>הגדרות מתנות</p>
        {rewardDefinitions.map((definition) => (
          <RewardDefinitionEditor key={definition.id} definition={definition} onSave={updateRewardDefinition} />
        ))}
      </section>

      <section className="economy-settings__tier">
        <p style={{ fontWeight: 700 }}>צליל</p>
        <SoundToggle />
      </section>
    </div>
  );
}

function RewardDefinitionEditor({
  definition,
  onSave,
}: {
  definition: RewardDefinition;
  onSave: (definition: RewardDefinition) => void;
}) {
  const [label, setLabel] = useState(definition.label);
  const [description, setDescription] = useState(definition.description);
  const [examples, setExamples] = useState(definition.examples.join(", "));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      ...definition,
      label: label.trim() || definition.label,
      description: description.trim(),
      examples: examples
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div className="form-field">
        <label htmlFor={`reward-def-label-${definition.id}`}>תווית ({definition.size})</label>
        <input id={`reward-def-label-${definition.id}`} value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor={`reward-def-desc-${definition.id}`}>תיאור</label>
        <input
          id={`reward-def-desc-${definition.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label htmlFor={`reward-def-examples-${definition.id}`}>רעיונות (מופרדים בפסיק)</label>
        <input
          id={`reward-def-examples-${definition.id}`}
          value={examples}
          onChange={(e) => setExamples(e.target.value)}
        />
      </div>
      <button type="button" className="btn btn--secondary" style={{ width: "auto" }} onClick={handleSave}>
        {saved ? "נשמר ✓" : "שמירה"}
      </button>
    </div>
  );
}
