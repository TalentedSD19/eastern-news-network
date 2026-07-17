import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SiteHeader() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []);

  return (
    <header className="bg-white/90 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-neutral-950/70 sticky top-0 z-50 shadow-sm">
      {/* Thin red accent line at very top */}
      <div className="h-1 bg-brand-red" />

      {/* ── Identity bar: date | masthead | search ── */}
      <div className="border-b border-gray-200 dark:border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">

          {/* Date — left, hidden on mobile */}
          <div className="flex-1 hidden sm:block">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-sans tracking-wide" suppressHydrationWarning>
              {format(new Date(), "EEE, dd MMM yyyy")}
            </span>
          </div>

          {/* Masthead — always centered on desktop, fills remaining space on mobile */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial justify-start sm:justify-start group">
            <Image
              src="/android-chrome-192x192.png"
              alt="Eastern News Network logo"
              width={48}
              height={48}
              className="w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-sm object-contain flex-shrink-0"
              priority
            />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-serif font-bold text-[1.3rem] sm:text-[2rem] md:text-[2.4rem] text-gray-900 dark:text-gray-50 tracking-tight leading-none group-hover:text-brand-red transition-colors duration-200 truncate max-w-full">
                Eastern News Network
              </span>
              <span className="text-[0.5rem] sm:text-[0.65rem] tracking-[0.15em] sm:tracking-[0.22em] text-gray-400 dark:text-gray-500 uppercase mt-1 sm:mt-1.5 font-sans truncate max-w-full">
                From the East, To the World
              </span>
            </div>
          </Link>

          {/* Search + theme toggle — right, hidden on mobile */}
          <div className="flex-1 hidden sm:flex justify-end items-center gap-2">
            <SearchBar />
            <ThemeToggle />
          </div>

          {/* Mobile: hamburger on right — fixed width, doesn't compete with masthead for space */}
          <div className="flex justify-end shrink-0 sm:hidden">
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>

      {/* ── Category nav bar ── */}
      <div className="hidden sm:block border-b border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <CategoryNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
