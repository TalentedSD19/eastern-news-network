import Link from "next/link";
import { Prisma } from "@prisma/client";
import { BarChart3, CheckCircle2, ImageIcon, MessageSquare, Plus, ThumbsDown, ThumbsUp, X, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteArticleButton from "./DeleteArticleButton";
import PublishToggleButton from "./PublishToggleButton";
import ArticleSearchInput from "./ArticleSearchInput";
import ArticleRow from "./ArticleRow";
import ViewsSparkline from "@/components/admin/charts/ViewsSparkline";
import { getLifetimeDailyViews } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
] as const;

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; published?: string };
}) {
  const q = searchParams.q?.trim();
  const status = STATUS_TABS.find((t) => t.value === searchParams.status)?.value;

  const searchWhere: Prisma.ArticleWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
          { reporterName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [articles, statusRows] = await Promise.all([
    prisma.article.findMany({
      where: { ...searchWhere, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        author: { select: { name: true } },
        _count: { select: { views: true, comments: true } },
      },
    }),
    prisma.article.groupBy({ by: ["status"], where: searchWhere, _count: { id: true } }),
  ]);
  const statusCounts: Record<string, number> = { DRAFT: 0, PUBLISHED: 0 };
  for (const row of statusRows) statusCounts[row.status] = row._count.id;
  const totalCount = statusCounts.DRAFT + statusCounts.PUBLISHED;
  const filtered = Boolean(q || status);

  // Set by the editor right after an article goes live.
  const justPublished = searchParams.published
    ? await prisma.article.findUnique({
        where: { id: searchParams.published },
        select: { title: true, slug: true, status: true },
      })
    : null;

  const [voteRows, dailyViews, allIds] = await Promise.all([
    prisma.vote.groupBy({
      by: ["articleId", "voteType"],
      where: { articleId: { in: articles.map((a) => a.id) } },
      _count: { id: true },
    }),
    getLifetimeDailyViews(articles),
    // Every article's id oldest-first, so an article keeps its number while searching/filtering.
    filtered ? prisma.article.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } }) : null,
  ]);
  const articleNo = allIds
    ? new Map(allIds.map((a, i) => [a.id, i + 1]))
    : new Map(articles.map((a, i) => [a.id, articles.length - i]));
  const voteCounts = new Map<string, { up: number; down: number }>();
  for (const row of voteRows) {
    const entry = voteCounts.get(row.articleId) ?? { up: 0, down: 0 };
    if (row.voteType === "UP") entry.up = row._count.id;
    else entry.down = row._count.id;
    voteCounts.set(row.articleId, entry);
  }

  function tabHref(value?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("status", value);
    const qs = params.toString();
    return qs ? `/dashboard/articles?${qs}` : "/dashboard/articles";
  }

  const tabs = [
    { value: undefined, label: "All", count: totalCount },
    ...STATUS_TABS.map((t) => ({ ...t, count: statusCounts[t.value] })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-medium tracking-tight text-2xl">Articles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {statusCounts.PUBLISHED} published · {statusCounts.DRAFT} {statusCounts.DRAFT === 1 ? "draft" : "drafts"}
            {q && <> matching &ldquo;{q}&rdquo;</>}
          </p>
        </div>
        <Link
          href="/dashboard/articles/new"
          className={cn(buttonVariants(), "bg-brand-accent hover:bg-brand-accent-dark text-white gap-1.5")}
        >
          <Plus className="size-4" />
          New Article
        </Link>
      </div>

      {justPublished?.status === "PUBLISHED" && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="flex-1 min-w-0">
            <strong className="font-semibold">&ldquo;{justPublished.title}&rdquo;</strong> is now live on the site.
          </span>
          <a
            href={`/article/${justPublished.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            View article
          </a>
          <Link href={tabHref(status)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
            <X className="size-4" />
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <nav className="flex items-center gap-1" aria-label="Filter by status">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={tabHref(t.value)}
              aria-current={status === t.value ? "page" : undefined}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                status === t.value
                  ? "bg-brand-accent text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
              )}
            >
              {t.label}
              <span className={cn("ml-1.5 tabular-nums", status === t.value ? "text-white/80" : "text-gray-400 dark:text-gray-500")}>
                {t.count}
              </span>
            </Link>
          ))}
        </nav>
        <ArticleSearchInput />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right w-10">#</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="hidden lg:table-cell">Views since published</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => {
              const votes = voteCounts.get(a.id) ?? { up: 0, down: 0 };
              const isPublished = a.status === "PUBLISHED";
              return (
                <ArticleRow key={a.id} href={`/dashboard/articles/${a.id}/edit`}>
                  <TableCell className="text-right text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {articleNo.get(a.id)}
                  </TableCell>
                  {/* w-full + max-w-0 lets this column take the leftover width and truncate inside it */}
                  <TableCell className="w-full max-w-0">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-100 dark:bg-white/5">
                        {a.coverImage ? (
                          // Plain <img>: covers can come from hosts next/image isn't configured for.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.coverImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        {/* Real link so the edit page is reachable by keyboard; the row handles mouse clicks */}
                        <Link
                          href={`/dashboard/articles/${a.id}/edit`}
                          className="block font-medium truncate hover:text-brand-accent transition-colors"
                          title={a.title}
                        >
                          {a.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {a.reporterName ?? a.author.name}
                          <span className="text-gray-300 dark:text-gray-600 mx-1.5">·</span>
                          {a.category.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className={cn("size-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-gray-400")} />
                      <span className={isPublished ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {isPublished && a.publishedAt ? formatDate(a.publishedAt) : `Edited ${formatDate(a.updatedAt)}`}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a._count.views > 0 ? (
                      a._count.views.toLocaleString()
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1.5">
                    {a._count.views > 0 ? (
                      <ViewsSparkline data={dailyViews.get(a.id) ?? []} width={120} />
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    <div
                      className="flex items-center gap-3"
                      title={`${votes.up} up · ${votes.down} down · ${a._count.comments} comments`}
                    >
                      <Stat icon={ThumbsUp} value={votes.up} activeClass="text-emerald-600 dark:text-emerald-400" />
                      <Stat icon={ThumbsDown} value={votes.down} activeClass="text-rose-600 dark:text-rose-400" />
                      <Stat icon={MessageSquare} value={a._count.comments} activeClass="text-gray-700 dark:text-gray-200" />
                    </div>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <PublishToggleButton id={a.id} currentStatus={a.status} />
                      <Link
                        href={`/dashboard/articles/${a.id}/metrics`}
                        title="Metrics"
                        aria-label={`Metrics for ${a.title}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                      >
                        <BarChart3 />
                      </Link>
                      <DeleteArticleButton id={a.id} title={a.title} />
                    </div>
                  </TableCell>
                </ArticleRow>
              );
            })}
            {articles.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center py-14">
                  <p className="text-gray-500 dark:text-gray-400">
                    {q
                      ? `No articles matching “${q}”.`
                      : status === "DRAFT"
                        ? "No drafts — everything is published."
                        : status === "PUBLISHED"
                          ? "Nothing published yet."
                          : "No articles yet."}
                  </p>
                  {!filtered && (
                    <Link
                      href="/dashboard/articles/new"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
                    >
                      Write your first article
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Icon + count; zero counts are greyed out so the non-zero ones stand out.
function Stat({ icon: Icon, value, activeClass }: { icon: LucideIcon; value: number; activeClass: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", value > 0 ? activeClass : "text-gray-300 dark:text-gray-600")}>
      <Icon className="size-3.5" />
      {value}
    </span>
  );
}
