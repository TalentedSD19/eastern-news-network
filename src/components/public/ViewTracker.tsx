"use client";

import { useEffect, useRef } from "react";

// Where the reader came from. The request's own Referer header is useless here (it's always
// this article page), and document.referrer only reflects the last full page load — after an
// in-app navigation it would still name the original landing source — so a client-side
// navigation is reported as coming from this site.
function getReferrer(): string {
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  const isLandingPage = !nav || nav.name.split("#")[0] === location.href.split("#")[0];
  return isLandingPage ? document.referrer : location.origin;
}

export default function ViewTracker({ articleId }: { articleId: string }) {
  const sent = useRef(false);
  const viewIdRef = useRef<string | null>(null);
  const maxScrollRef = useRef(0);
  const activeSecondsRef = useRef(0);
  const lastVisibleAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/articles/${articleId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: getReferrer() }),
    })
      .then((res) => res.json())
      .then((data: { viewId?: string }) => {
        if (data?.viewId) viewIdRef.current = data.viewId;
      })
      .catch(() => {});
  }, [articleId]);

  // Scroll depth + "actually visible" reading time, reported as a single best-effort
  // beacon whenever the tab is hidden (covers backgrounding, tab switches, and the
  // final pagehide) — not incremental, so a returning tab just extends the same totals.
  useEffect(() => {
    function computeScrollPct(): number {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return 100;
      return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
    }

    function handleScroll() {
      const pct = computeScrollPct();
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
    }

    function tickActiveTime() {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (lastVisibleAtRef.current !== null) {
          activeSecondsRef.current += (now - lastVisibleAtRef.current) / 1000;
        }
        lastVisibleAtRef.current = now;
      } else {
        lastVisibleAtRef.current = null;
      }
    }

    function sendEngagementBeacon() {
      const viewId = viewIdRef.current;
      if (!viewId) return;
      tickActiveTime(); // flush time accrued since the last tick
      try {
        const blob = new Blob(
          [
            JSON.stringify({
              maxScrollPct: maxScrollRef.current,
              activeSeconds: Math.round(activeSecondsRef.current),
            }),
          ],
          { type: "application/json" }
        );
        navigator.sendBeacon(`/api/views/${viewId}/engagement`, blob);
      } catch {
        // best-effort — never block the page for this
      }
    }

    function handleVisibilityChange() {
      tickActiveTime();
      if (document.visibilityState === "hidden") sendEngagementBeacon();
    }

    lastVisibleAtRef.current = document.visibilityState === "visible" ? Date.now() : null;
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendEngagementBeacon);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendEngagementBeacon);
    };
  }, []);

  return null;
}
