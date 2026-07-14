// Device-level preference (not a family setting) — a shared tablet might
// want sound off while a parent's phone wants it on, so this lives in
// localStorage, not Supabase.
const MUTE_KEY = "hp.economy.soundMuted";

export function isSoundMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}
