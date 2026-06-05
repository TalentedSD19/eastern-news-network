import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import CategoryNav from "./CategoryNav";
import SearchBar from "./SearchBar";
import MobileMenu from "./MobileMenu";

export default async function SiteHeader() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []);

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Thin red accent line at very top */}
      <div className="h-1 bg-brand-red" />

      {/* ── Identity bar: date | masthead | search ── */}
      <div className="border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center">

          {/* Date — left, hidden on mobile */}
          <div className="flex-1 hidden sm:block">
            <span className="text-xs text-gray-500 font-sans tracking-wide" suppressHydrationWarning>
              {format(new Date(), "EEE, dd MMM yyyy")}
            </span>
          </div>

          {/* Masthead — always centered */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
            <Image
              src="/android-chrome-192x192.png"
              alt="Eastern News Network logo"
              width={48}
              height={48}
              className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-sm object-contain flex-shrink-0"
              priority
            />
            <div className="flex flex-col items-start">
              <span className="font-serif font-bold text-[1.6rem] sm:text-[2rem] md:text-[2.4rem] text-gray-900 tracking-tight leading-none group-hover:text-brand-red transition-colors duration-200">
                Eastern News Network
              </span>
              <span className="text-[0.55rem] sm:text-[0.65rem] tracking-[0.22em] text-gray-400 uppercase mt-1.5 font-sans">
                From the East, To the World
              </span>
            </div>
          </Link>

          {/* Search — right, hidden on mobile */}
          <div className="flex-1 hidden sm:flex justify-end">
            <SearchBar />
          </div>

          {/* Mobile: hamburger on right */}
          <div className="flex-1 flex justify-end sm:hidden">
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>

      {/* ── Category nav bar ── */}
      <div className="hidden sm:block border-b border-gray-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <CategoryNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
