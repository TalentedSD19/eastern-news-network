"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const widthRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    function start() {
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
    }

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
        start();
      } catch {
        // ignore invalid URLs
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setCompleting(true);
    setWidth(100);
    widthRef.current = 100;

    const t = setTimeout(() => {
      setVisible(false);
      setCompleting(false);
      setWidth(0);
      widthRef.current = 0;
    }, 400);
    return () => clearTimeout(t);
  }, [pathname]);

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
