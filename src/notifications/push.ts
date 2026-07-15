import { supabase } from "../storage/supabaseClient";
import { generateId } from "../utils/id";

export type PushRole = "parent" | "child";

export type PushSupportStatus = "unsupported" | "denied" | "not-subscribed" | "subscribed";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushStatus(): Promise<PushSupportStatus> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  return existing ? "subscribed" : "not-subscribed";
}

// Requests permission (if needed) and subscribes this device to Web Push,
// then upserts the subscription into Supabase keyed by role/child so the
// notify-* Edge Functions know which devices to reach.
export async function requestAndSubscribe(role: PushRole, childId?: string): Promise<void> {
  if (!isPushSupported()) throw new Error("Push notifications are not supported on this device.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission-denied");

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      id: generateId(),
      device_role: role,
      child_id: role === "child" ? childId ?? null : null,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}
