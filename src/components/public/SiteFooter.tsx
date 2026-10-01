import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SiteFooter() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, take: 6 }).catch(() => []);

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/" },
        ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Editorial Policy", href: "/editorial-policy" },
      ],
    },
    {
      title: "Connect",
      links: [
        { label: "RSS Feed", href: "/rss.xml" },
      ],
    },
  ];

  return (
    <footer className="bg-brand-dark dark:bg-black text-gray-400 mt-16">
      <div className="h-1 bg-brand-accent" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 lg:justify-between">
          <div className="max-w-xs">
            <p className="font-display font-extrabold text-white text-2xl tracking-tight">
              Eastern News Network
            </p>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mt-1.5 mb-4">
              From the East, To the World
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Independent news from the East — politics, economy, society, and culture.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 flex-1 lg:max-w-xl">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-200 mb-4">
                  {col.title}
                </p>
                <nav className="flex flex-col gap-2.5 text-sm">
                  {col.links.map((link) => (
                    <Link key={link.href} href={link.href} className="hover:text-brand-accent transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Eastern News Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
