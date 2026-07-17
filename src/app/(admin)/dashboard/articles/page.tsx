import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import DeleteArticleButton from "./DeleteArticleButton";
import PublishToggleButton from "./PublishToggleButton";
import ArticleSearchInput from "./ArticleSearchInput";

export const dynamic = "force-dynamic";

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const articles = await prisma.article.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { reporterName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { views: true } },
    },
  });

  const voteRows = await prisma.vote.groupBy({
    by: ["articleId", "voteType"],
    where: { articleId: { in: articles.map((a) => a.id) } },
    _count: { id: true },
  });
  const voteCounts = new Map<string, { up: number; down: number }>();
  for (const row of voteRows) {
    const entry = voteCounts.get(row.articleId) ?? { up: 0, down: 0 };
    if (row.voteType === "UP") entry.up = row._count.id;
    else entry.down = row._count.id;
    voteCounts.set(row.articleId, entry);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-2xl font-bold">Articles</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ArticleSearchInput />
          <Link
            href="/dashboard/articles/new"
            className={cn(buttonVariants(), "bg-brand-red hover:bg-brand-red/90 text-white")}
          >
            New Article
          </Link>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Upvotes</TableHead>
              <TableHead>Downvotes</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => {
              const votes = voteCounts.get(a.id) ?? { up: 0, down: 0 };
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                  <TableCell>{a.category.name}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{a._count.views}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {votes.up}
                  </TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 font-semibold">
                    {votes.down}
                  </TableCell>
                  <TableCell>{formatDate(a.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PublishToggleButton id={a.id} currentStatus={a.status} />
                      <Link
                        href={`/dashboard/articles/${a.id}/metrics`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Metrics
                      </Link>
                      <Link
                        href={`/dashboard/articles/${a.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                      <DeleteArticleButton id={a.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 dark:text-gray-500 py-10">
                  {q ? `No articles matching "${q}".` : "No articles yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
