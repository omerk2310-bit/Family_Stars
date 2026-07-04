const STORAGE_KEY = "hp.deviceRole";

export type DeviceRole = { kind: "unset" } | { kind: "parent" } | { kind: "child"; childId: string };

export function getStoredDeviceRole(): DeviceRole {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { kind: "unset" };
  try {
    const parsed = JSON.parse(raw) as DeviceRole;
    if (parsed.kind === "parent" || parsed.kind === "child") return parsed;
    return { kind: "unset" };
  } catch {
    return { kind: "unset" };
  }
}

export function setStoredDeviceRole(role: DeviceRole): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(role));
}

export function clearStoredDeviceRole(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function parseDeepLinkRole(search: string): DeviceRole | null {
  const params = new URLSearchParams(search);
  const childId = params.get("child");
  if (childId) return { kind: "child", childId };
  if (params.get("role") === "parent") return { kind: "parent" };
  return null;
}
