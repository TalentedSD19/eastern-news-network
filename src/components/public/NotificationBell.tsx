"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUSH_CHANGE_EVENT, hasSubscription, isPushSupported, requestAndSubscribe, unsubscribe } from "@/lib/pushClient";

type State = "loading" | "unsupported" | "on" | "off" | "blocked";

async function readState(): Promise<State> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && (await hasSubscription())) return "on";
  return "off";
}

// Header bell for turning new-story alerts on or off at any time — the standing
// control news sites keep next to search, alongside the one-off prompt.
export default function NotificationBell() {
  const [state, setState] = useState<State>("loading");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    readState()
      .then(setState)
      .catch(() => setState("off"));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(PUSH_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(PUSH_CHANGE_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function toggle() {
    setBusy(true);
    try {
      if (state === "on") await unsubscribe();
      else await requestAndSubscribe();
    } catch (error) {
      console.error("Push toggle failed", error);
    } finally {
      setBusy(false);
      refresh();
    }
  }

  if (state === "unsupported") return null;
  if (state === "loading") return <div className="h-11 w-11 sm:h-9 sm:w-9" aria-hidden />;

  const Icon = state === "on" ? BellRing : state === "blocked" ? BellOff : Bell;
  const label = state === "on" ? "News alerts are on" : state === "blocked" ? "News alerts are blocked" : "Turn on news alerts";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Icon size={18} />
        {state === "on" && <span className="absolute right-2.5 top-2.5 sm:right-1.5 sm:top-1.5 size-2 rounded-full bg-brand-accent ring-2 ring-brand-dark dark:ring-black" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="News alerts"
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xl dark:border-white/10 dark:bg-neutral-900 z-[60]"
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {state === "on" ? "News alerts are on" : state === "blocked" ? "News alerts are blocked" : "Get news alerts"}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {state === "on"
              ? "We'll send a notification to this browser when a new story is published."
              : state === "blocked"
                ? "Your browser is blocking notifications from this site. To allow them, click the icon to the left of the address bar, open site settings and set Notifications to Allow."
                : "Get a notification in this browser as soon as a new story is published."}
          </p>
          {state !== "blocked" && (
            <button
              type="button"
              onClick={toggle}
              disabled={busy}
              className={cn(
                "mt-3 inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-60",
                state === "on"
                  ? "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
                  : "bg-brand-red text-white hover:bg-brand-red/90"
              )}
            >
              {busy ? "…" : state === "on" ? "Turn off alerts" : "Turn on alerts"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
