import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-brand-dark dark:bg-black text-gray-400 mt-16">
      <div className="h-1 bg-brand-red" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-serif font-bold text-white text-xl tracking-tight">
              Eastern News Network
            </p>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mt-1">
              From the East, To the World
            </p>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/editorial-policy" className="hover:text-white transition-colors">Editorial Policy</Link>
          </nav>
        </div>
        <div className="border-t border-white/10 mt-5 pt-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Eastern News Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
