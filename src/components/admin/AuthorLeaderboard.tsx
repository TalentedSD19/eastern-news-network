import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuthorStats } from "@/lib/metrics";

interface Props {
  authors: AuthorStats[];
  /** Builds the link that filters the whole page to one author. */
  authorHref: (byline: string) => string;
}

export default function AuthorLeaderboard({ authors, authorHref }: Props) {
  if (authors.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No activity in this period yet.</p>;
  }
  const maxViews = Math.max(1, ...authors.map((a) => a.views));

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Author</TableHead>
          <TableHead className="text-right" title="Articles published in this period">
            Published
          </TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right hidden md:table-cell" title="Average views for each article that was read this period">
            Per article
          </TableHead>
          <TableHead className="text-right hidden md:table-cell" title="Share of readers who scrolled through at least 80% of the article">
            Read to end
          </TableHead>
          <TableHead className="text-right pr-5 hidden sm:table-cell" title="Votes and comments">
            Reactions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {authors.map((a) => (
          <TableRow key={a.byline}>
            {/* w-full + max-w-0 lets this column take the leftover width and truncate inside it */}
            <TableCell className="pl-5 w-full max-w-0">
              <Link
                href={authorHref(a.byline)}
                title={`Show metrics for ${a.byline} only`}
                className="block font-medium truncate hover:text-brand-accent transition-colors"
              >
                {a.byline}
              </Link>
              <div className="mt-1 h-1 max-w-[12rem] rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-brand-accent/60" style={{ width: `${Math.max(2, (a.views / maxViews) * 100)}%` }} />
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {a.published > 0 ? a.published : <span className="text-gray-300 dark:text-gray-600">0</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums font-semibold">{a.views.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums hidden md:table-cell">
              {a.articlesRead > 0 ? Math.round(a.views / a.articlesRead).toLocaleString() : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums hidden md:table-cell">
              {a.completionRate !== null ? `${a.completionRate}%` : <span className="text-gray-300 dark:text-gray-600">—</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums pr-5 hidden sm:table-cell">
              {a.reactions > 0 ? a.reactions.toLocaleString() : <span className="text-gray-300 dark:text-gray-600">0</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
