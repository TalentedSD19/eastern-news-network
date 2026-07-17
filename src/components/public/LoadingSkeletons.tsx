import Link from "next/link";

export function HeaderSkeleton() {
  return (
    <header className="bg-white dark:bg-neutral-950 shadow-sm">
      <div className="h-1 bg-brand-red" />
      <div className="border-b border-gray-200 dark:border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <div className="flex-1 hidden sm:block">
            <div className="h-2.5 w-28 bg-gray-100 dark:bg-white/10 rounded animate-pulse" />
          </div>
          <Link href="/" className="flex flex-col items-center flex-shrink-0">
            <span className="font-serif font-bold text-[1.6rem] sm:text-[2rem] md:text-[2.4rem] text-gray-900 dark:text-gray-50 tracking-tight leading-none">
              Eastern News Network
            </span>
            <span className="text-[0.55rem] sm:text-[0.65rem] tracking-[0.22em] text-gray-400 dark:text-gray-500 uppercase mt-1.5 font-sans">
              From the East, To the World
            </span>
          </Link>
          <div className="flex-1 hidden sm:flex justify-end">
            <div className="h-7 w-44 bg-gray-100 dark:bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 flex justify-end sm:hidden" />
        </div>
      </div>
      <div className="hidden sm:block border-b border-gray-200 dark:border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex gap-5">
          {[80, 64, 96, 72, 80].map((w, i) => (
            <div key={i} className="h-3 bg-gray-100 dark:bg-white/10 rounded animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>
    </header>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200 dark:bg-white/10" />
      <div className="p-4 border-t border-gray-100 dark:border-white/10 space-y-3">
        <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-16" />
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-5/6" />
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-28" />
      </div>
    </div>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="bg-brand-dark dark:bg-black text-gray-400 mt-16">
      <div className="h-1 bg-brand-red" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-serif font-bold text-white text-xl tracking-tight">Eastern News Network</p>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mt-1">From the East, To the World</p>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </nav>
        </div>
        <div className="border-t border-white/10 mt-5 pt-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Eastern News Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
