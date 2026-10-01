import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SiteHeader() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []);

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* ── Masthead bar ── */}
      <div className="bg-brand-dark dark:bg-black">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 sm:h-[4.5rem] flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <Image
              src="/android-chrome-192x192.png"
              alt="Eastern News Network logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-sm object-contain flex-shrink-0"
              priority
            />
            <div className="flex flex-col items-start min-w-0 leading-none">
              <span className="font-display font-semibold text-[0.95rem] sm:text-lg md:text-xl text-white tracking-tight leading-none truncate max-w-full group-hover:text-brand-accent transition-colors duration-200">
                Eastern News Network
              </span>
              <span className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.2em] text-gray-400 uppercase mt-1 font-sans truncate max-w-full">
                From the East, To the World
              </span>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Search + theme toggle — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <SearchBar onDark />
            <ThemeToggle variant="onDark" />
          </div>

          {/* Mobile: hamburger */}
          <div className="flex sm:hidden items-center shrink-0">
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>

      {/* ── Category tab bar ── */}
      <div className="hidden sm:block border-b border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <CategoryNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
