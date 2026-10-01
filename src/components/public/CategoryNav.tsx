"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

export default function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, categories]);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  const linkClass = (active: boolean) =>
    cn(
      "px-3 py-3 text-[0.78rem] font-sans font-semibold uppercase whitespace-nowrap border-b-2 transition-colors duration-150 tracking-wide",
      active
        ? "border-brand-accent text-brand-accent"
        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:border-gray-600"
    );

  return (
    <div className="relative flex items-center">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-200)}
          aria-label="Scroll categories left"
          className="absolute left-0 z-10 flex h-full items-center pr-4 pl-0.5 bg-gradient-to-r from-white dark:from-neutral-950 via-white dark:via-neutral-950 to-transparent"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 shadow-sm">
            <ChevronLeft size={14} />
          </span>
        </button>
      )}

      <nav
        ref={scrollerRef}
        className="flex items-center overflow-x-auto scrollbar-hide scroll-smooth -mb-px"
      >
        <Link href="/" className={linkClass(pathname === "/")}>
          Home
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={linkClass(pathname === `/category/${cat.slug}`)}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(200)}
          aria-label="Scroll categories right"
          className="absolute right-0 z-10 flex h-full items-center pl-4 pr-0.5 bg-gradient-to-l from-white dark:from-neutral-950 via-white dark:via-neutral-950 to-transparent"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 shadow-sm">
            <ChevronRight size={14} />
          </span>
        </button>
      )}
    </div>
  );
}
