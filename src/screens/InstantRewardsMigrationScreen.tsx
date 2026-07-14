import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { getActiveChildren, getAvailableGoldStarsForChild, getAvailableStarsForChild } from "../storage/selectors";
import { AppShell } from "../components/layout/AppShell";
import "./InstantRewardsMigrationScreen.css";

interface InstantRewardsMigrationScreenProps {
  onDone: () => void;
}

export function InstantRewardsMigrationScreen({ onDone }: InstantRewardsMigrationScreenProps) {
  const { children, starEvents, starAdjustments, rewardRedemptions, rewards, legacyGrants, addLegacyGrant, settings, updateSettings } =
    useAppData();
  const [granted, setGranted] = useState<Set<string>>(new Set());

  const activeChildren = getActiveChildren(children);
  const balances = activeChildren.map((child) => ({
    child,
    stars: getAvailableStarsForChild(child.id, starEvents, starAdjustments, rewardRedemptions, rewards),
    goldStars: getAvailableGoldStarsForChild(child.id, starEvents, starAdjustments, rewardRedemptions, rewards),
  }));
  const withBalance = balances.filter((b) => b.stars > 0 || b.goldStars > 0);

  function grantClosingGift(childId: string, stars: number, goldStars: number) {
    if (legacyGrants.some((g) => g.childId === childId)) return;
    const parts: string[] = [];
    if (stars > 0) parts.push(`${stars} כוכבים`);
    if (goldStars > 0) parts.push(`${goldStars} כוכבי זהב`);
    addLegacyGrant({
      id: childId,
      childId,
      size: "large",
      sourceNote: `סגירת חשבון מהמערכת הקודמת (${parts.join(" ו-")})`,
      grantedAt: new Date().toISOString(),
    });
    setGranted((prev) => new Set(prev).add(childId));
  }

  function handleFinish() {
    updateSettings({ ...settings, economyMigrationShown: true });
    onDone();
  }

  return (
    <AppShell title="שדרוג המערכת">
      <div className="instant-rewards-migration">
        <p className="instant-rewards-migration__intro">
          האפליקציה עברה למודל תגמול מיידי: כל התנהגות חיובית מזכה בכוכב ארד באופן מיידי, עם יעדים יומיים, שבועיים
          וחודשיים במקום צבירה ארוכת טווח. הכוכבים שנצברו עד עכשיו נשארים שמורים בהיסטוריה, אבל לא ימשיכו להצטבר
          במערכת החדשה.
        </p>

        {withBalance.length === 0 ? (
          <p className="instant-rewards-migration__intro">אין יתרות משמעותיות מהמערכת הקודמת — אפשר להתחיל!</p>
        ) : (
          <div className="instant-rewards-migration__list">
            {withBalance.map(({ child, stars, goldStars }) => (
              <div key={child.id} className="instant-rewards-migration__card">
                <p className="instant-rewards-migration__card-title">{child.displayName}</p>
                <p className="instant-rewards-migration__card-balance">
                  {stars > 0 && <span>⭐ {stars} כוכבים</span>}
                  {goldStars > 0 && <span>🌟 {goldStars} כוכבי זהב</span>}
                </p>
                {granted.has(child.id) || legacyGrants.some((g) => g.childId === child.id) ? (
                  <p className="instant-rewards-migration__granted">מתנת פרידה גדולה הוענקה ✓</p>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => grantClosingGift(child.id, stars, goldStars)}
                  >
                    להעניק מתנת פרידה גדולה כסגירת חשבון
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn btn--secondary" onClick={handleFinish}>
          המשך למערכת החדשה
        </button>
      </div>
    </AppShell>
  );
}
