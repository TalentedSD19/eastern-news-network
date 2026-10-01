import Link from "next/link";

export function HeaderSkeleton() {
  return (
    <header className="shadow-sm">
      <div className="bg-brand-dark dark:bg-black">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 sm:h-[4.5rem] flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <span className="font-display font-semibold text-[0.95rem] sm:text-lg md:text-xl text-white tracking-tight leading-none">
              Eastern News Network
            </span>
          </Link>
          <div className="flex-1" />
          <div className="hidden sm:block h-8 w-44 bg-white/10 rounded-full animate-pulse" />
          <div className="hidden sm:block h-9 w-9 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="hidden sm:block border-b border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950">
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
    <div className="animate-pulse">
      <div className="aspect-video rounded-md bg-gray-200 dark:bg-white/10" />
      <div className="pt-3 space-y-3">
        <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-16" />
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-28" />
      </div>
    </div>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="bg-brand-dark dark:bg-black text-gray-400 mt-16">
      <div className="h-1 bg-brand-accent" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:justify-between">
          <div className="max-w-xs">
            <p className="font-display font-semibold text-white text-2xl tracking-tight">Eastern News Network</p>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mt-1.5">From the East, To the World</p>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </nav>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Eastern News Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
