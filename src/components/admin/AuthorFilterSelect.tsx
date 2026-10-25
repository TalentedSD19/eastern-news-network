"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useProgressRouter } from "@/lib/navigationProgress";

interface Props {
  authors: string[];
  activeAuthor?: string;
}

export default function AuthorFilterSelect({ authors, activeAuthor }: Props) {
  const router = useProgressRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("author", e.target.value);
    } else {
      params.delete("author");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      value={activeAuthor ?? ""}
      onChange={handleChange}
      className="h-8 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-accent"
    >
      <option value="">All authors</option>
      {authors.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
