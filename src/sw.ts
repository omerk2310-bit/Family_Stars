import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Keeps the offline-caching behavior vite-plugin-pwa's default generateSW
// mode used to provide automatically — injectManifest mode requires wiring
// this by hand, which is the tradeoff for being able to add the push
// handling below.
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  url?: string;
}

// If some window of the app is already open and focused, message it directly
// instead of showing a system banner — the open app already has (or will
// get, via Realtime) the richer in-app sound/celebration for the same event,
// so a system notification on top of that would just be a duplicate ping.
async function hasFocusedClient(): Promise<boolean> {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return clients.some((c) => (c as WindowClient).focused);
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json() as PushPayload;

  event.waitUntil(
    (async () => {
      if (await hasFocusedClient()) {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        clients.forEach((c) => c.postMessage({ type: "push-payload", payload }));
        return;
      }
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: payload.tag,
        data: { url: payload.url ?? "/" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        await (existing as WindowClient).focus();
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
