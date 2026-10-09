import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  Share2,
  Signpost,
  Timer,
  ExternalLink,
  Eye,
  Globe,
  ImageIcon,
  MessageSquare,
  Pencil,
  Smartphone,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import MetricsStatCard, { MeterBar } from "@/components/admin/MetricsStatCard";
import MetricsPanel from "@/components/admin/MetricsPanel";
import RankedList from "@/components/admin/RankedList";
import DeviceSplit from "@/components/admin/DeviceSplit";
import TrendAreaChart from "@/components/admin/charts/TrendAreaChart";
import {
  countryName,
  getArticleReferrers,
  getArticleViewsSincePublish,
  getCategoryComparison,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

function formatSeconds(total: number): string {
  if (total <= 0) return "0s";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function ArticleMetricsPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverImage: true,
      publishedAt: true,
      reporterName: true,
      categoryId: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  if (!article) notFound();

  const where = { articleId: params.id };
  const publishedAt = article.publishedAt;
  const [
    totalViews,
    visitorRows,
    geoRows,
    deviceRows,
    readAgg,
    completedReads,
    voteRows,
    comments,
    viewsOverTime,
    firstDayViews,
    shareRows,
    referrers,
    comparison,
  ] = await Promise.all([
      prisma.articleView.count({ where }),
      prisma.articleView.findMany({
        where: { ...where, visitorId: { not: null } },
        distinct: ["visitorId"],
        select: { visitorId: true },
      }),
      prisma.articleView.groupBy({
        by: ["country", "region"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }),
      prisma.articleView.groupBy({ by: ["deviceType"], where, _count: { id: true } }),
      prisma.articleView.aggregate({
        where: { ...where, maxScrollPct: { not: null } },
        _avg: { maxScrollPct: true, activeSeconds: true },
        _count: { id: true },
      }),
      prisma.articleView.count({ where: { ...where, maxScrollPct: { gte: 80 } } }),
      prisma.vote.groupBy({ by: ["voteType"], where, _count: { id: true } }),
      prisma.comment.findMany({ where, orderBy: { createdAt: "desc" } }),
      getArticleViewsSincePublish(article),
      publishedAt
        ? prisma.articleView.count({
            where: { ...where, viewedAt: { gte: publishedAt, lt: new Date(publishedAt.getTime() + 86_400_000) } },
          })
        : Promise.resolve(0),
      prisma.shareClick.groupBy({ by: ["platform"], where, _count: { id: true } }),
      getArticleReferrers(article.id),
      article.status === "PUBLISHED" ? getCategoryComparison(article) : Promise.resolve(null),
    ]);

  const upvotes = voteRows.find((r) => r.voteType === "UP")?._count.id ?? 0;
  const downvotes = voteRows.find((r) => r.voteType === "DOWN")?._count.id ?? 0;
  const totalVotes = upvotes + downvotes;
  const upShare = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

  const trackedReads = readAgg._count.id;
  const completionRate = trackedReads > 0 ? Math.round((completedReads / trackedReads) * 100) : 0;
  const avgScroll = Math.round(readAgg._avg.maxScrollPct ?? 0);
  const avgSeconds = Math.round(readAgg._avg.activeSeconds ?? 0);

  const peakDay = viewsOverTime.reduce<(typeof viewsOverTime)[number] | undefined>(
    (best, d) => (!best || d.views > best.views ? d : best),
    undefined
  );
  const isPublished = article.status === "PUBLISHED";
  const publishedToday = publishedAt !== null && Date.now() - publishedAt.getTime() < 86_400_000;
  const shares = shareRows
    .map((r) => ({ label: r.platform, value: r._count.id }))
    .sort((a, b) => b.value - a.value);
  const totalShares = shares.reduce((sum, d) => sum + d.value, 0);
  const vsAverage = comparison && comparison.categoryAverage > 0 ? totalViews / comparison.categoryAverage : null;

  const locations = geoRows.map((r) => ({
    label: r.region ? `${r.region}, ${countryName(r.country)}` : countryName(r.country),
    value: r._count.id,
  }));
  const devices = deviceRows
    .map((r) => ({
      label: r.deviceType ? r.deviceType[0].toUpperCase() + r.deviceType.slice(1) : "Unknown",
      value: r._count.id,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="size-3.5" />
          Articles
        </Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="shrink-0 w-full sm:w-32 aspect-[16/10] rounded-md overflow-hidden bg-gray-100 dark:bg-white/5">
            {article.coverImage ? (
              // Plain <img>: covers can come from hosts next/image isn't configured for.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-medium tracking-tight text-2xl line-clamp-2">{article.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-1.5">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className={cn("size-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-gray-400")} />
                <span className={isPublished ? "text-emerald-700 dark:text-emerald-400" : undefined}>
                  {isPublished ? "Published" : "Draft"}
                </span>
              </span>
              {article.publishedAt && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  {formatDate(article.publishedAt)}
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              {article.category.name}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              {article.reporterName ?? article.author.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/articles/${article.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
            {isPublished && (
              <a
                href={`/article/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <ExternalLink className="size-3.5" />
                View on site
              </a>
            )}
          </div>
        </div>
      </div>

      {comparison && comparison.of > 1 && vsAverage !== null && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
          <Award className="size-4 text-brand-accent shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold">#{comparison.rank}</strong> of {comparison.of} articles in{" "}
            {comparison.category} by views ·{" "}
            {vsAverage >= 1.05 ? (
              <>
                <strong className="font-semibold">{vsAverage.toFixed(1)}×</strong> the views of an average {comparison.category} article
              </>
            ) : vsAverage <= 0.95 ? (
              <>
                {Math.round(vsAverage * 100)}% of the views of an average {comparison.category} article
              </>
            ) : (
              <>about the same views as an average {comparison.category} article</>
            )}{" "}
            ({Math.round(comparison.categoryAverage).toLocaleString()}).
          </p>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricsStatCard
          label="Views"
          icon={Eye}
          value={totalViews}
          hint={
            visitorRows.length > 0
              ? `${visitorRows.length.toLocaleString()} different readers since it was published.`
              : "Times the article was opened."
          }
        />
        <MetricsStatCard
          label="Read to the end"
          icon={BookOpenCheck}
          value={`${completionRate}%`}
          empty={trackedReads > 0 ? undefined : "Not enough reading data yet."}
          hint={`On average readers scroll ${avgScroll}% of the way down and spend ${formatSeconds(avgSeconds)} reading.`}
        >
          <MeterBar pct={completionRate} label="Read to the end" />
        </MetricsStatCard>
        <MetricsStatCard
          label="First 24 hours"
          icon={Timer}
          value={firstDayViews}
          empty={publishedAt ? undefined : "Not published yet."}
          hint={
            publishedToday
              ? "Still inside its first day — this number is live."
              : totalViews > 0
                ? `${Math.round((firstDayViews / totalViews) * 100)}% of all its views came on the first day.`
                : "Views in the day after it went live."
          }
        />
        <MetricsStatCard
          label="Votes"
          icon={ThumbsUp}
          value={totalVotes}
          hint={`${totalVotes > 0 ? `${upShare}% positive` : "No votes yet"} · ${comments.length.toLocaleString()} ${
            comments.length === 1 ? "comment" : "comments"
          } · ${totalShares.toLocaleString()} ${totalShares === 1 ? "share" : "shares"}`}
        >
          {totalVotes > 0 && (
            <div>
              <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5" aria-hidden>
                <div className="bg-emerald-500" style={{ width: `${upShare}%` }} />
                <div className="bg-rose-500" style={{ width: `${100 - upShare}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs tabular-nums">
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <ThumbsUp className="size-3.5" /> {upvotes.toLocaleString()} up
                </span>
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                  <ThumbsDown className="size-3.5" /> {downvotes.toLocaleString()} down
                </span>
              </div>
            </div>
          )}
        </MetricsStatCard>
      </div>

      {/* Views since published */}
      <MetricsPanel
        title="Views since published"
        subtitle="Daily views from the day it went live to today"
        icon={TrendingUp}
        insight={
          peakDay && peakDay.views > 0 ? (
            <>
              Best day was <strong className="font-semibold">{formatDate(`${peakDay.date}T12:00:00Z`)}</strong> with{" "}
              {peakDay.views.toLocaleString()} views.
            </>
          ) : undefined
        }
      >
        {viewsOverTime.length > 0 ? (
          <TrendAreaChart data={viewsOverTime} />
        ) : (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            The graph starts once the article is published.
          </p>
        )}
      </MetricsPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricsPanel title="How readers found it" subtitle="The site or app a reader came from" icon={Signpost}>
          <RankedList data={referrers.sources} emptyMessage="No sources recorded yet." />
          {referrers.untracked > 0 && (
            <p className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
              {referrers.untracked.toLocaleString()} older {referrers.untracked === 1 ? "view was" : "views were"} recorded
              before sources were tracked, so {referrers.untracked === 1 ? "it isn't" : "they aren't"} counted here.
            </p>
          )}
        </MetricsPanel>
        <MetricsPanel title="Where readers are" subtitle="Top locations by views" icon={Globe}>
          <RankedList
            data={locations}
            limit={8}
            emptyMessage="No location data yet — it fills in once the site is live on Vercel."
          />
        </MetricsPanel>
        <MetricsPanel title="Shared to" subtitle="Where readers shared it using the share buttons" icon={Share2} className="md:col-span-2 xl:col-span-1">
          <RankedList data={shares} valueSuffix="shares" emptyMessage="Nobody has shared it yet." />
        </MetricsPanel>
      </div>

      <MetricsPanel title="Devices" subtitle="What people read it on" icon={Smartphone}>
        <DeviceSplit data={devices} />
      </MetricsPanel>

      {/* Comments */}
      <MetricsPanel
        title="Comments"
        subtitle={comments.length > 0 ? `${comments.length.toLocaleString()} from readers, newest first` : "What readers said"}
        icon={MessageSquare}
      >
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No comments yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5 -my-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 py-4">
                <span className="flex items-center justify-center size-8 shrink-0 rounded-full bg-brand-accent/10 text-brand-accent text-sm font-semibold uppercase">
                  {c.authorName.trim()[0] ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{c.authorName}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">{formatDate(c.createdAt)}</span>
                  </p>
                  {/* Comments need to wrap, including long URLs */}
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </MetricsPanel>
    </div>
  );
}
