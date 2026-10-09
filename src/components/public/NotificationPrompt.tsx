"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PUSH_CHANGE_EVENT,
  hasAnswered,
  isPushSupported,
  isSnoozed,
  requestAndSubscribe,
  snooze,
  subscribe,
} from "@/lib/pushClient";

// Ask once the reader is engaged — scrolled part way down or stayed a while —
// rather than the moment they land, the way most news sites time this alert.
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 10_000;
const ENGAGED_SCROLL_PCT = 30;

function scrollPct(): number {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - doc.clientHeight;
  return scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
}

// Shows an in-page alert asking readers to turn on new-article notifications.
// The browser's own permission dialog is only requested from the "Allow" click,
// since Safari and Firefox ignore (and Chrome quietly hides) requests made
// without a user gesture.
export default function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    if (Notification.permission === "granted") {
      subscribe().catch((error) => console.error("Push subscribe failed", error));
      return;
    }
    if (Notification.permission !== "default" || hasAnswered() || isSnoozed()) return;

    const loadedAt = Date.now();
    const show = () => setOpen(true);
    let timer = setTimeout(show, MAX_DELAY_MS);
    // Scrolling far enough brings the alert forward — but never sooner than MIN_DELAY_MS.
    function handleScroll() {
      if (scrollPct() < ENGAGED_SCROLL_PCT) return;
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
      timer = setTimeout(show, Math.max(0, MIN_DELAY_MS - (Date.now() - loadedAt)));
    }
    // Turning alerts on from the header bell answers the question too.
    function handleChange() {
      setOpen(false);
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(PUSH_CHANGE_EVENT, handleChange);
    // The reader may already have scrolled before this hydrated.
    handleScroll();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(PUSH_CHANGE_EVENT, handleChange);
    };
  }, []);

  async function handleAllow() {
    setBusy(true);
    try {
      await requestAndSubscribe();
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
      role="dialog"
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
            Allow notifications and we&apos;ll let you know as soon as a new story is published. You can turn them off
            any time from the bell at the top of the page.
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
