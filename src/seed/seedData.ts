import type {
  AppSettings,
  Behavior,
  Child,
  HeartEventType,
  RedEventType,
  Reward,
} from "../types/entities";

const CHILD_BECHORA_ID = "seed-child-bechora";
const CHILD_KTANA_ID = "seed-child-ktana";

export const seedChildren: Child[] = [
  {
    id: CHILD_BECHORA_ID,
    name: "בכורה",
    displayName: "הבכורה",
    color: "#7c5cff",
    icon: "🦄",
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: CHILD_KTANA_ID,
    name: "קטנה",
    displayName: "הקטנה",
    color: "#ff8fab",
    icon: "🌸",
    order: 1,
    createdAt: new Date().toISOString(),
  },
];

export const seedBehaviors: Behavior[] = [
  // הבכורה
  {
    id: "seed-behavior-bechora-safe-words",
    childId: CHILD_BECHORA_ID,
    title: "מילים בטוחות",
    description:
      'במקום מילים כמו "אני ארצח אותך", "הלוואי שתמותי" או קללות קשות — השתמשה במשפט כעס כמו "אני כועסת", "תעזבי אותי", "אני צריכה הפסקה".',
    points: 5,
    category: "תקשורת בטוחה",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-word-repair",
    childId: CHILD_BECHORA_ID,
    title: "תיקון מילים",
    description: "התחילה במילים קשות, אבל אחרי תזכורת עצרה ותיקנה למשפט בטוח.",
    points: 3,
    category: "תיקון",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-safe-body",
    childId: CHILD_BECHORA_ID,
    title: "גוף בטוח",
    description:
      "בזמן כעס לא הרביצה, לא זרקה, לא דחפה ולא טרקה בצורה מסוכנת; במקום זה התרחקה או קראה להורה.",
    points: 5,
    category: "ויסות רגשי",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-calm-night",
    childId: CHILD_BECHORA_ID,
    title: "לילה רגוע",
    description:
      "בלילה, במקום צרחות בלי הסבר, אמרה במשפט קצר מה היא צריכה: מים, חיבוק, פחד, כאב, חלום רע או קשה לי להירדם.",
    points: 4,
    category: "שינה",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-return-to-calm",
    childId: CHILD_BECHORA_ID,
    title: "חזרה לשקט בלילה",
    description: "אחרי שקיבלה מענה קצר, חזרה למיטה או לשקט בלי להמשיך לצרוח.",
    points: 3,
    category: "שינה",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-accepting-no",
    childId: CHILD_BECHORA_ID,
    title: "קבלת לא",
    description: 'שמעה "לא" או גבול, כעסה או התאכזבה, אבל בלי איומים, בלי פגיעה ובלי צרחות ממושכות.',
    points: 4,
    category: "גבולות",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-sibling-conflict",
    childId: CHILD_BECHORA_ID,
    title: "פתרון ריב עם אחות",
    description:
      'בזמן ריב עם אחותה הציעה תור־תור, קראה להורה, התרחקה, או אמרה "אני צריכה הפסקה ממנה".',
    points: 4,
    category: "יחסים עם אחים",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-storm-repair",
    childId: CHILD_BECHORA_ID,
    title: "תיקון אחרי סערה",
    description: "אחרי התפרצות עשתה תיקון: סליחה, ציור, סידור מה שנזרק, משפט תיקון, או חיבוק אם מתאים לה.",
    points: 5,
    category: "תיקון",
    isBonus: false,
  },
  {
    id: "seed-behavior-bechora-courage-bonus",
    childId: CHILD_BECHORA_ID,
    title: "בונוס אומץ",
    description: "מצב שהיה לה קשה במיוחד והיא הצליחה לעצור אפילו חלקית.",
    points: 3,
    category: "בונוס",
    isBonus: true,
    minPoints: 3,
    maxPoints: 5,
  },
  // הקטנה
  {
    id: "seed-behavior-ktana-explain-not-just-cry",
    childId: CHILD_KTANA_ID,
    title: "להסביר במקום רק לבכות",
    description:
      'כשהיא בכתה או הייתה מתוסכלת, היא הצליחה להגיד מה קרה או מה היא רוצה: "אני עצובה", "רציתי ללכת לחברה", "אני כועסת", "אני רוצה חיבוק".',
    points: 4,
    category: "תקשורת בטוחה",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-explained-after-reminder",
    childId: CHILD_KTANA_ID,
    title: "הסבירה אחרי תזכורת",
    description: 'התחילה בבכי בלי הסבר, אבל אחרי שאמא/אבא אמרו "תני מילים לבכי", היא הסבירה.',
    points: 3,
    category: "תקשורת בטוחה",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-accepting-no",
    childId: CHILD_KTANA_ID,
    title: "קיבלה לא",
    description: "קיבלה גבול או תשובה שלילית בלי מאבק ארוך, בלי צרחות ממושכות, בלי זריקת דברים ובלי דרישה חוזרת שוב ושוב.",
    points: 5,
    category: "גבולות",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-accepting-no-friend",
    childId: CHILD_KTANA_ID,
    title: "קיבלה לא בנושא חברה",
    description: "כשלא ניתן ללכת לחברה או להזמין חברה, היא התאכזבה אבל נשארה בגבול, אמרה שקשה לה או בחרה חלופה.",
    points: 5,
    category: "גבולות",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-nice-words",
    childId: CHILD_KTANA_ID,
    title: "מילים נעימות",
    description:
      'השתמשה במילים כמו "בבקשה", "אפשר?", "זה לא נעים לי", "אני רוצה", "אני לא רוצה", "אני צריכה עזרה", במקום צעקות או דרישות.',
    points: 3,
    category: "תקשורת בטוחה",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-small-repair",
    childId: CHILD_KTANA_ID,
    title: "תיקון קטן",
    description:
      'אם היא בכתה, צעקה או דיברה לא יפה — אחרי שנרגעה היא אמרה משפט תיקון כמו "סליחה שצעקתי", "הייתי עצובה", "אני אנסה שוב".',
    points: 4,
    category: "תיקון",
    isBonus: false,
  },
  {
    id: "seed-behavior-ktana-maturity-bonus",
    childId: CHILD_KTANA_ID,
    title: "בונוס בגרות",
    description: "מצב שהיה לה ממש קשה והיא הצליחה לעצור, להסביר או לקבל תשובה למרות האכזבה.",
    points: 3,
    category: "בונוס",
    isBonus: true,
    minPoints: 3,
    maxPoints: 5,
  },
];

export const seedHeartEventTypes: HeartEventType[] = [
  {
    id: "seed-heart-play-together",
    title: "משחק נעים יחד",
    description: "שתיהן/כולם שיחקו 10–15 דקות בלי ריב גדול.",
    hearts: 1,
  },
  {
    id: "seed-heart-resolved-fight",
    title: "ריב שנפתר",
    description: "היה ריב אבל הוא נגמר בלי מכות ובלי איומים.",
    hearts: 1,
  },
  {
    id: "seed-heart-nice-repair",
    title: "תיקון יפה",
    description: "אחת עשתה תיקון והשנייה קיבלה אותו יפה.",
    hearts: 1,
  },
  {
    id: "seed-heart-calm-evening",
    title: "ערב רגוע",
    description: "הערב עבר בלי צעקות קשות בבית.",
    hearts: 1,
  },
  {
    id: "seed-heart-helped-together",
    title: "עזרה יחד",
    description: "כולם עזרו בסידור, בשגרה או במשימה ביתית.",
    hearts: 1,
  },
  {
    id: "seed-heart-special-moment",
    title: "רגע משפחתי יפה במיוחד",
    description: "רגע יוצא דופן של שיתוף פעולה, ויתור, עזרה או אווירה טובה.",
    hearts: 2,
  },
];

export const seedRedEventTypes: RedEventType[] = [
  { id: "seed-red-bechora-death-words", childId: CHILD_BECHORA_ID, label: "מילים של מוות או פגיעה" },
  { id: "seed-red-bechora-harsh-curses", childId: CHILD_BECHORA_ID, label: "קללות קשות" },
  { id: "seed-red-bechora-physical-harm", childId: CHILD_BECHORA_ID, label: "פגיעה פיזית" },
  { id: "seed-red-bechora-throwing", childId: CHILD_BECHORA_ID, label: "זריקת חפצים" },
  { id: "seed-red-bechora-night-screams", childId: CHILD_BECHORA_ID, label: "צרחות בלילה בלי ניסיון להסביר" },
  { id: "seed-red-bechora-hurt-sister", childId: CHILD_BECHORA_ID, label: "פגיעה באחות" },
  { id: "seed-red-bechora-escalation", childId: CHILD_BECHORA_ID, label: "המשך הסלמה אחרי גבול" },
  { id: "seed-red-ktana-prolonged-crying", childId: CHILD_KTANA_ID, label: "בכי ממושך בלי הסבר" },
  { id: "seed-red-ktana-hard-to-accept-no", childId: CHILD_KTANA_ID, label: "קושי לקבל לא" },
  { id: "seed-red-ktana-friend-difficulty", childId: CHILD_KTANA_ID, label: "קושי סביב חברה" },
  { id: "seed-red-ktana-repeated-demand", childId: CHILD_KTANA_ID, label: "צעקות או דרישה חוזרת" },
  { id: "seed-red-ktana-hit-back", childId: CHILD_KTANA_ID, label: "החזרת מכה" },
  { id: "seed-red-ktana-unpleasant-talk", childId: CHILD_KTANA_ID, label: "דיבור לא נעים" },
];

let rewardOrder = 0;
function nextOrder() {
  return rewardOrder++;
}

export const seedRewards: Reward[] = [
  // small
  { id: "seed-reward-bedtime-story", title: "לבחור סיפור לפני השינה", cost: 5, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-tv-10", title: "10 דקות טלוויזיה", cost: 8, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-small-dessert", title: "קינוח קטן בבית", cost: 10, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-song-or-game", title: "בחירת שיר או משחק קצר", cost: 10, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-ice-cream-snack", title: "גלידה או חטיף קטן בצרכניה", cost: 15, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-tv-20", title: "20 דקות טלוויזיה", cost: 15, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-parent-time-15", title: "זמן אישי עם אבא/אמא 15 דקות", cost: 20, type: "small", requiresParentApproval: false, order: nextOrder() },
  { id: "seed-reward-choose-dinner", title: "בחירת ארוחת ערב פשוטה", cost: 25, type: "small", requiresParentApproval: false, order: nextOrder() },
  // medium
  { id: "seed-reward-special-creation", title: "יצירה מיוחדת", cost: 60, type: "medium", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-ice-cream-outing", title: "יציאה לגלידה עם הורה", cost: 80, type: "medium", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-small-gift-30", title: "מתנה קטנה עד 30 ₪", cost: 120, type: "medium", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-gift-50", title: "מתנה עד 50 ₪", cost: 180, type: "medium", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-doll-70", title: "סמוצ'י / בובה קטנה עד 70 ₪", cost: 250, type: "medium", requiresParentApproval: true, order: nextOrder() },
  // family (cost measured in family hearts, redeemable once hearts reach the family heart target)
  { id: "seed-reward-family-pizza", title: "ערב פיצה", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-family-movie", title: "סרט משפחתי", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-family-ice-cream", title: "גלידה משפחתית", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-family-trip", title: "טיול קטן", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-family-board-game", title: "משחק קופסה משפחתי", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
  { id: "seed-reward-family-dinner-choice", title: "ארוחת ערב שהבנות בוחרות", cost: 10, type: "family", requiresParentApproval: true, order: nextOrder() },
];

export const seedSettings: AppSettings = {
  dailyStarCap: 15,
  dailyHeartCap: 2,
  familyHeartTarget: 10,
};
