import webpush from "npm:web-push@3.6.7";

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  url?: string;
}

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
  Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
);

// Sends to every subscription, tolerating individual failures — one dead
// registration (uninstalled app, expired endpoint) must not block delivery
// to the rest. Returns the ids of subscriptions that came back 404/410 so
// the caller can delete them (a push service returning those codes means
// the subscription is gone for good, not a transient error).
export async function sendToSubscriptions(
  subs: PushSubscriptionRow[],
  payload: PushPayload
): Promise<{ deadSubscriptionIds: string[] }> {
  const deadSubscriptionIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadSubscriptionIds.push(sub.id);
        } else {
          console.error(`push send failed for subscription ${sub.id}:`, err);
        }
      }
    })
  );

  return { deadSubscriptionIds };
}
