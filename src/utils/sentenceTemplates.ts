export interface WeeklyBehaviorSummary {
  title: string;
  category: string;
  count: number;
}

const NOT_ENOUGH_DATA = "עוד אין מספיק נתונים השבוע";

const categoryTemplates: Record<string, (name: string, title: string) => string> = {
  "תקשורת בטוחה": (name, title) =>
    `השבוע ${name} הראתה כוח יפה בלמצוא מילים בטוחות, בעיקר עם "${title}". זה כוח אמיתי.`,
  "ויסות רגשי": (name, title) =>
    `השבוע ${name} הצליחה לשמור על גוף ורגש בטוחים גם ברגעים קשים, בעיקר עם "${title}".`,
  גבולות: (name, title) =>
    `השבוע ${name} הצליחה לקבל גבולות ותשובות לא קלות, בעיקר עם "${title}". יישר כוח.`,
  שינה: (name, title) => `השבוע ${name} הראתה התקדמות יפה בלילות, בעיקר עם "${title}".`,
  תיקון: (name, title) => `השבוע ${name} ידעה לעצור ולתקן, בעיקר עם "${title}". זה בגרות אמיתית.`,
  "יחסים עם אחים": (name, title) =>
    `השבוע ${name} מצאה דרכים טובות להתמודד עם ריבים, בעיקר עם "${title}".`,
  בונוס: (name, title) => `השבוע ${name} עצרה במצב ממש לא קל, בעיקר עם "${title}". כל הכבוד.`,
};

const genericTemplate = (name: string, title: string) =>
  `השבוע ראינו ש${name} הצטיינה ב"${title}". זה כוח אמיתי.`;

const secondaryClause = (title: string) => ` היא גם הקפידה על "${title}".`;

export function generateWeeklySentence(childName: string, topBehaviors: WeeklyBehaviorSummary[]): string {
  if (topBehaviors.length === 0) return NOT_ENOUGH_DATA;

  const [first, second] = topBehaviors;
  const template = categoryTemplates[first.category] ?? genericTemplate;
  let sentence = template(childName, first.title);

  if (second) {
    sentence += secondaryClause(second.title);
  }

  return sentence;
}
