export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function stripToSignedDigits(value: string): string {
  const negative = value.includes("-");
  const digits = value.replace(/[^\d]/g, "");
  return negative ? `-${digits}` : digits;
}

export function parseIntOrFallback(value: string, fallback: number): number {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? fallback : n;
}
