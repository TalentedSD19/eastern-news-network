import Link from "next/link";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";

export default async function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-4">Error 404</p>
        <h1 className="font-display font-extrabold text-7xl text-gray-900 mb-4">Not Found</h1>
        <div className="w-10 h-0.5 bg-brand-accent mb-6 mx-auto" />
        <p className="text-gray-500 mb-8 text-lg max-w-xs">
          This page could not be found. It may have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-accent text-sm font-semibold hover:underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
