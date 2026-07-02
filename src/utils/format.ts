const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatHebrewDate(date: Date): string {
  return dateFormatter.format(date);
}

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatHebrewTime(isoDate: string): string {
  return timeFormatter.format(new Date(isoDate));
}

export function formatHebrewDateTime(isoDate: string): string {
  return `${dateFormatter.format(new Date(isoDate))}, ${formatHebrewTime(isoDate)}`;
}
