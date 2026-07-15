const STORAGE_KEY = "hp.deviceRole";
const PARENT_UNLOCKED_KEY = "hp.parentUnlocked";

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

// Persists across app reloads — once a device proves the parent PIN once, it
// stays unlocked (Home + Settings) until an explicit "switch user" clears
// this alongside the stored role.
export function getParentUnlocked(): boolean {
  return localStorage.getItem(PARENT_UNLOCKED_KEY) === "1";
}

export function setParentUnlocked(unlocked: boolean): void {
  if (unlocked) {
    localStorage.setItem(PARENT_UNLOCKED_KEY, "1");
  } else {
    localStorage.removeItem(PARENT_UNLOCKED_KEY);
  }
}

export function parseDeepLinkRole(search: string): DeviceRole | null {
  const params = new URLSearchParams(search);
  const childId = params.get("child");
  if (childId) return { kind: "child", childId };
  if (params.get("role") === "parent") return { kind: "parent" };
  return null;
}
