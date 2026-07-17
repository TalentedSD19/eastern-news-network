"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard/articles", label: "Articles" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/profile", label: "Profile" },
];

interface AdminSidebarProps {
  userName: string;
  avatarUrl: string | null;
}

export default function AdminSidebar({ userName, avatarUrl }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const avatar = (
    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-red shrink-0 flex items-center justify-center">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={userName} fill className="object-cover" />
      ) : (
        <span className="text-xs font-bold text-white select-none">
          {userName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden bg-brand-dark text-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-2">
            <Image src="/android-chrome-192x192.png" alt="ENN" width={36} height={36} className="rounded-sm" />
            <span className="font-serif text-lg font-bold">ENN Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle variant="onDark" />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-b border-white/10 shadow-lg">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              {avatar}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400">Edit profile</p>
              </div>
            </Link>
            <nav className="px-3 py-2 space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-brand-red text-white"
                      : "text-gray-300 hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-white/10">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-brand-dark text-white min-h-screen flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-2">
            <Image src="/android-chrome-192x192.png" alt="ENN" width={42} height={42} className="rounded-sm" />
            <span className="font-serif text-xl font-bold">ENN</span>
          </Link>
        </div>

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-4 py-4 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-brand-red shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={userName} fill className="object-cover" />
            ) : (
              <span className="text-sm font-bold text-white select-none">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-400">Edit profile</p>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-brand-red text-white"
                  : "text-gray-300 hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-1">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
          <ThemeToggle variant="onDark" className="h-9 w-9" />
        </div>
      </aside>
    </>
  );
}
