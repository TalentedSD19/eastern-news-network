"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

// Table row that opens the article's edit page when clicked anywhere outside its own buttons/links.
export default function ArticleRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    // Clicks inside portalled UI (e.g. the delete dialog) still bubble here through React.
    if (!e.currentTarget.contains(target) || target.closest("a, button")) return;
    if (window.getSelection()?.toString()) return; // let people select text without navigating
    if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
    else router.push(href);
  }

  return (
    <TableRow className="cursor-pointer" onClick={handleClick}>
      {children}
    </TableRow>
  );
}
