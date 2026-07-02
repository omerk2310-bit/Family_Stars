export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isSameLocalDay(isoDate: string, reference: Date): boolean {
  const d = new Date(isoDate);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

/** Calendar week, Sunday–Saturday, containing `reference`. */
export function getWeekRange(reference: Date): { start: Date; end: Date } {
  const start = startOfLocalDay(reference);
  start.setDate(start.getDate() - start.getDay());
  const end = endOfLocalDay(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function isWithinRange(isoDate: string, start: Date, end: Date): boolean {
  const t = new Date(isoDate).getTime();
  return t >= start.getTime() && t <= end.getTime();
}
