"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

// The red bar at the top of the page (NavigationProgress) listens here, so anything that
// makes people wait — a fetch, a router call — can show it.
type Listener = (event: "start" | "done") => void;
const listeners = new Set<Listener>();

export function startProgress() {
  listeners.forEach((l) => l("start"));
}

export function doneProgress() {
  listeners.forEach((l) => l("done"));
}

export function subscribeProgress(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isCurrentUrl(href: string) {
  const url = new URL(href, window.location.href);
  return url.pathname === window.location.pathname && url.search === window.location.search;
}

// useRouter() whose push, replace and refresh show the progress bar until the new page has rendered.
export function useProgressRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
    } else if (wasPending.current) {
      wasPending.current = false;
      doneProgress();
    }
  }, [isPending]);

  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => {
        if (!isCurrentUrl(href)) startProgress();
        startTransition(() => router.push(href, options));
      },
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
        if (!isCurrentUrl(href)) startProgress();
        startTransition(() => router.replace(href, options));
      },
      refresh: () => {
        startProgress();
        startTransition(() => router.refresh());
      },
    }),
    [router]
  );
}
