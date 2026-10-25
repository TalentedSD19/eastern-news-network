"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { subscribeProgress } from "@/lib/navigationProgress";

// Gives up if a navigation never lands (e.g. a link that redirects back to the same page).
const SAFETY_TIMEOUT_MS = 15000;

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams}`;
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const widthRef = useRef(0);
  const active = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrl = useRef(url);

  const done = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setCompleting(true);
    setWidth(100);
    widthRef.current = 100;

    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setCompleting(false);
      setWidth(0);
      widthRef.current = 0;
    }, 400);
  }, []);

  const start = useCallback(() => {
    // Already running: keep going rather than jumping back to zero.
    if (active.current) return;
    active.current = true;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    widthRef.current = 0;
    setWidth(0);
    setVisible(true);
    setCompleting(false);

    intervalRef.current = setInterval(() => {
      widthRef.current = Math.min(85, widthRef.current + (85 - widthRef.current) * 0.08 + 0.4);
      setWidth(widthRef.current);
      if (widthRef.current >= 85 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 60);
    safetyTimer.current = setTimeout(done, SAFETY_TIMEOUT_MS);
  }, [done]);

  useEffect(() => subscribeProgress((event) => (event === "start" ? start() : done())), [start, done]);

  useEffect(() => {
    // Capture phase, because next/link calls preventDefault() on the clicks it handles.
    function handleClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab/window
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      try {
        const next = new URL(anchor.href, window.location.href);
        if (next.origin !== window.location.origin) return;
        // Same page, or only the #hash differs: nothing to load.
        if (next.pathname === window.location.pathname && next.search === window.location.search) return;
        start();
      } catch {
        // ignore invalid URLs
      }
    }

    // Back/forward: the address bar has already changed. Pages Next has cached are rendered by the
    // time this runs (nothing to wait for); anything it still has to fetch shows the bar.
    function handlePopState() {
      const next = `${window.location.pathname}?${new URLSearchParams(window.location.search)}`;
      if (next !== prevUrl.current) start();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [start]);

  useEffect(() => {
    if (url === prevUrl.current) return;
    prevUrl.current = url;
    done();
  }, [url, done]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    },
    []
  );

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-brand-accent"
        style={{
          width: `${width}%`,
          transition: completing ? "width 0.25s ease-out" : undefined,
          boxShadow: "0 1px 8px rgba(242,84,28,0.5)",
        }}
      />
    </div>
  );
}
