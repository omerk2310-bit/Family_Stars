import type { Entity } from "../types/entities";

export function getCollection<T extends Entity>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function saveCollection<T extends Entity>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function upsert<T extends Entity>(key: string, item: T): T[] {
  const items = getCollection<T>(key);
  const index = items.findIndex((i) => i.id === item.id);
  const next = index === -1 ? [...items, item] : items.map((i, idx) => (idx === index ? item : i));
  saveCollection(key, next);
  return next;
}

export function removeEntity<T extends Entity>(key: string, id: string): T[] {
  const items = getCollection<T>(key);
  const next = items.filter((i) => i.id !== id);
  saveCollection(key, next);
  return next;
}

export function archiveEntity<T extends Entity & { archived?: boolean }>(
  key: string,
  id: string,
  archived = true
): T[] {
  const items = getCollection<T>(key);
  const next = items.map((i) => (i.id === id ? { ...i, archived } : i));
  saveCollection(key, next);
  return next;
}

export function getById<T extends Entity>(key: string, id: string): T | undefined {
  return getCollection<T>(key).find((i) => i.id === id);
}
