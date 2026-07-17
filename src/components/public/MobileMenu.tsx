"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import ThemeToggle from "@/components/ThemeToggle";

type Category = { id: string; name: string; slug: string };

export default function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const linkClass = (active: boolean) =>
    cn(
      "block px-4 py-3 text-sm font-medium transition-colors border-l-2",
      active
        ? "text-brand-red border-brand-red bg-red-50 dark:bg-brand-red/10"
        : "text-gray-700 border-transparent hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
    );

  return (
    <div ref={ref} className="sm:hidden flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-white/10 shadow-lg z-50 max-w-full">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <SearchBar wide />
            <ThemeToggle className="shrink-0" />
          </div>
          <nav className="px-2 pb-4 pt-2 space-y-0.5">
            <Link href="/" onClick={() => setOpen(false)} className={linkClass(pathname === "/")}>
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setOpen(false)}
                className={linkClass(pathname === `/category/${cat.slug}`)}
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/about" onClick={() => setOpen(false)} className={linkClass(pathname === "/about")}>
              About
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
