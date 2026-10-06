"use client";

import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Give the page a moment to load before the browser's permission prompt appears.
const PROMPT_DELAY_MS = 3000;

// PushManager wants the VAPID key as raw bytes, not base64url.
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscribe() {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    }));

  // Upsert every visit so the server re-learns a subscription it pruned or lost.
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
}

// Renders nothing: asks once via the browser's native "Allow notifications?"
// prompt, and subscribes the reader to new-article notifications if they allow.
export default function NotificationPrompt() {
  useEffect(() => {
    if (
      !VAPID_PUBLIC_KEY ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }

    if (Notification.permission === "granted") {
      subscribe().catch((error) => console.error("Push subscribe failed", error));
      return;
    }
    if (Notification.permission !== "default") return;

    const timer = setTimeout(async () => {
      try {
        if ((await Notification.requestPermission()) === "granted") await subscribe();
      } catch (error) {
        console.error("Push subscribe failed", error);
      }
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
