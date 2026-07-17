"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

export default function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    cn(
      "px-3 py-3 text-[0.8rem] font-sans font-medium whitespace-nowrap border-b-2 transition-colors duration-150 tracking-wide",
      active
        ? "border-brand-red text-brand-red"
        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:border-gray-600"
    );

  return (
    <div className="relative">
      <nav className="flex items-center overflow-x-auto scrollbar-hide -mb-px">
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

        <Link href="/about" className={linkClass(pathname === "/about")}>
          About
        </Link>
      </nav>
      {/* Edge fade — hints there's more to scroll on narrower viewports */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent md:hidden" />
    </div>
  );
}
