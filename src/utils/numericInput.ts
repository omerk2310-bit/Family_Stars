export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseIntOrFallback(value: string, fallback: number): number {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? fallback : n;
}
