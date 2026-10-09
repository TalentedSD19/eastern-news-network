// Browser-side helpers for new-article push notifications, shared by the
// in-page prompt and the header bell. Client components only.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// After "Not now" / ✕ on the prompt, stay quiet for a day.
const SNOOZE_MS = 24 * 60 * 60 * 1000;
const SNOOZE_KEY = "enn-push-snoozed-until";
// Set once the reader has answered via "Allow" (prompt or bell): the prompt never
// comes back, even if the browser's own permission dialog was closed or blocked.
const ANSWERED_KEY = "enn-push-allowed";

/** Fired on window whenever this tab subscribes or unsubscribes, so the prompt and bell stay in sync. */
export const PUSH_CHANGE_EVENT = "enn-push-change";

/** Added to notification links so a visit from an alert can be told apart from a direct one. */
export const PUSH_SOURCE_PARAM = "utm_source";
export const PUSH_SOURCE_VALUE = "push";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(VAPID_PUBLIC_KEY) &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// PushManager wants the VAPID key as raw bytes, not base64url.
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function announce() {
  window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
}

/** Subscribes this browser (permission must already be granted) and registers it with the server. */
export async function subscribe(): Promise<void> {
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
  announce();
}

/** Asks for permission (must run from a click) and subscribes if granted. Returns the resulting permission. */
export async function requestAndSubscribe(): Promise<NotificationPermission> {
  rememberAnswered();
  const permission = await Notification.requestPermission();
  if (permission === "granted") await subscribe();
  else announce();
  return permission;
}

/** Stops alerts for this browser: drops the push subscription and removes it from the server. */
export async function unsubscribe(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe();
  }
  announce();
}

export async function hasSubscription(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  return Boolean(await reg?.pushManager.getSubscription());
}

export function hasAnswered(): boolean {
  try {
    return localStorage.getItem(ANSWERED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberAnswered() {
  try {
    localStorage.setItem(ANSWERED_KEY, "1");
  } catch {
    // Storage blocked: fall back to the day-long snooze.
  }
}

export function isSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Storage blocked: the alert just comes back next visit.
  }
}
