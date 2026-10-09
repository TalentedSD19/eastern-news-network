// Service worker for new-article browser notifications.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Eastern News Network", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Eastern News Network", {
      body: data.body || "",
      icon: "/android-chrome-192x192.png",
      // Android draws the badge as a white silhouette in the status bar, so it must be
      // a single-colour shape on transparency — a full-colour icon shows as a blank square.
      badge: "/notification-badge.png",
      image: data.image,
      tag: data.tag,
      timestamp: data.timestamp,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// Push services rotate or expire subscriptions now and then; re-subscribe with the
// same key and tell the server, so the reader doesn't silently stop getting alerts.
self.addEventListener("pushsubscriptionchange", (event) => {
  const options = event.oldSubscription?.options;
  event.waitUntil(
    (async () => {
      const sub =
        event.newSubscription ??
        (options ? await self.registration.pushManager.subscribe(options) : null);
      if (event.oldSubscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: event.oldSubscription.endpoint }),
        }).catch(() => {});
      }
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      }
    })()
  );
});
