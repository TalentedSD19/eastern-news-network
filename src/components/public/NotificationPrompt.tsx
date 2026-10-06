"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Give the page a moment to load before the alert slides in.
const PROMPT_DELAY_MS = 3000;
// After "Not now", stay quiet for a week.
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = "enn-push-snoozed-until";

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
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error(`Subscribe request failed: ${res.status}`);
}

function isSnoozed() {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Storage blocked: the alert just comes back next visit.
  }
}

// Shows an in-page alert asking readers to turn on new-article notifications.
// The browser's own permission dialog is only requested from the "Allow" click,
// since Safari and Firefox ignore (and Chrome quietly hides) requests made
// without a user gesture.
export default function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      !VAPID_PUBLIC_KEY ||
      !window.isSecureContext ||
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
    if (Notification.permission !== "default" || isSnoozed()) return;

    const timer = setTimeout(() => setOpen(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  async function handleAllow() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribe();
      else if (permission === "default") snooze();
    } catch (error) {
      console.error("Push subscribe failed", error);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  function handleDismiss() {
    snooze();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-labelledby="push-prompt-title"
      aria-describedby="push-prompt-body"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-neutral-900 sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <p id="push-prompt-title" className="text-sm font-semibold text-gray-900 dark:text-white">
            Get breaking news alerts
          </p>
          <p id="push-prompt-body" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Allow notifications and we&apos;ll let you know as soon as a new story is published.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={handleAllow}
              disabled={busy}
              className="bg-brand-red text-white hover:bg-brand-red/90"
            >
              {busy ? "…" : "Allow"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
