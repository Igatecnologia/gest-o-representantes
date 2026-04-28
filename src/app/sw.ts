import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ============= PUSH NOTIFICATIONS =============

self.addEventListener("push", (event) => {
  let data: {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    icon?: string;
    badge?: string;
  } = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "IGA", body: event.data.text() };
    }
  }

  const title = data.title ?? "IGA";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: data.icon ?? "/icons/icon-192.png",
    badge: data.badge ?? "/icons/icon-192.png",
    tag: data.tag,
    data: { url: data.url ?? "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem janela do app aberta, foca e navega
        for (const client of clientList) {
          if ("focus" in client) {
            (client as WindowClient).focus();
            (client as WindowClient).navigate(url);
            return;
          }
        }
        // Senão abre nova
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
