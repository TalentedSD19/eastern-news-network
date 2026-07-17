"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type SearchResult = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  category: { name: string; slug: string };
};

export default function SearchBar({ wide = false }: { wide?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 gap-2 focus-within:bg-white dark:focus-within:bg-white/5 focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:shadow-sm transition-all ${
          wide ? "w-full" : "w-48"
        }`}
      >
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search articles…"
          className="bg-transparent text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 outline-none w-full min-w-0"
        />
        {query && (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={clear}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div
          className={`absolute top-full mt-2 bg-white dark:bg-neutral-900 rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50 overflow-hidden ${
            wide ? "left-0 right-0" : "right-0 w-80"
          }`}
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No articles found for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul>
              {results.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/article/${article.slug}`}
                    onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
                    className="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/10 last:border-0"
                  >
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt=""
                        width={56}
                        height={40}
                        className="rounded object-cover shrink-0 self-start mt-0.5"
                      />
                    ) : (
                      <div className="w-14 h-10 rounded bg-gray-100 dark:bg-white/10 shrink-0 self-start mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[0.7rem] font-semibold text-brand-red mb-0.5 uppercase tracking-wide">
                        {article.category.name}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{article.excerpt}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
