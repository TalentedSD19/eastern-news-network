import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DayRange = number | null; // null = all time

function rangeStart(days: DayRange): Date {
  if (days === null) return new Date(0);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

// Same byline resolution as `resolveByline` in author/[slug]/page.tsx: reporterName
// wins when set, otherwise falls back to the account's display name.
function bylineWhere(authorFilter?: string): Prisma.ArticleWhereInput {
  if (!authorFilter) return {};
  return { OR: [{ reporterName: authorFilter }, { reporterName: null, author: { name: authorFilter } }] };
}

// Same resolution, as a raw-SQL fragment for the $queryRaw functions below.
// Every raw query joins `Article a` + `LEFT JOIN "User" u` so this fragment always
// has `a`/`u` available, whether or not a filter is actually applied.
function authorFilterFragment(authorFilter?: string) {
  if (!authorFilter) return Prisma.empty;
  return Prisma.sql`AND (a."reporterName" = ${authorFilter} OR (a."reporterName" IS NULL AND u.name = ${authorFilter}))`;
}

export async function getAuthorList(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ byline: string }[]>`
    SELECT DISTINCT COALESCE(a."reporterName", u.name) AS byline
    FROM "Article" a
    JOIN "User" u ON u.id = a."authorId"
    WHERE a.status = 'PUBLISHED'
    ORDER BY byline ASC
  `;
  return rows.map((r) => r.byline);
}

export interface OverallStats {
  periodViews: number;
  previousPeriodViews: number | null;
  uniqueVisitors: number;
  publishedArticles: number;
  comments: number;
  upVotes: number;
  downVotes: number;
}

export async function getOverallStats(days: DayRange, authorFilter?: string): Promise<OverallStats> {
  const since = rangeStart(days);
  const articleWhere = bylineWhere(authorFilter);

  const [periodViews, previousPeriodViews, uniqueVisitorRows, publishedArticles, comments, upVotes, downVotes] =
    await Promise.all([
      prisma.articleView.count({ where: { viewedAt: { gte: since }, article: articleWhere } }),
      days === null
        ? Promise.resolve(null)
        : prisma.articleView.count({
            where: { viewedAt: { gte: rangeStart(days * 2), lt: since }, article: articleWhere },
          }),
      prisma.articleView.findMany({
        where: { viewedAt: { gte: since }, visitorId: { not: null }, article: articleWhere },
        distinct: ["visitorId"],
        select: { visitorId: true },
      }),
      prisma.article.count({ where: { status: "PUBLISHED", ...articleWhere } }),
      prisma.comment.count({ where: { createdAt: { gte: since }, article: articleWhere } }),
      prisma.vote.count({ where: { voteType: "UP", createdAt: { gte: since }, article: articleWhere } }),
      prisma.vote.count({ where: { voteType: "DOWN", createdAt: { gte: since }, article: articleWhere } }),
    ]);

  return {
    periodViews,
    previousPeriodViews,
    uniqueVisitors: uniqueVisitorRows.length,
    publishedArticles,
    comments,
    upVotes,
    downVotes,
  };
}

export interface DailyViews {
  date: string; // yyyy-mm-dd
  views: number;
  weightedAvg: number; // linearly-weighted moving average, recent days weighted higher
}

const WMA_WINDOW = 7;

// Weighted moving average ending at `index`: within the trailing window, the most
// recent day gets weight `window`, the oldest in the window gets weight 1 — so a
// one-day spike is smoothed but recent momentum still shows through faster than
// a simple average would.
function weightedMovingAverage(values: number[], index: number, window = WMA_WINDOW): number {
  const start = Math.max(0, index - window + 1);
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = start; i <= index; i++) {
    const weight = i - start + 1;
    weightedSum += values[i] * weight;
    weightTotal += weight;
  }
  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

export async function getViewsOverTime(days: DayRange, authorFilter?: string): Promise<DailyViews[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ day: Date; views: bigint }[]>`
    SELECT date_trunc('day', v."viewedAt") AS day, COUNT(*)::bigint AS views
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE v."viewedAt" >= ${since}
    ${authorFrag}
    GROUP BY day
    ORDER BY day ASC
  `;

  const counts = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.views)]));

  const spanDays = days ?? Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86_400_000));
  const dates: string[] = [];
  const views: number[] = [];
  for (let i = spanDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dates.push(key);
    views.push(counts.get(key) ?? 0);
  }

  return dates.map((date, i) => ({
    date,
    views: views[i],
    weightedAvg: Math.round(weightedMovingAverage(views, i) * 10) / 10,
  }));
}

export interface HourlyViews {
  hour: number; // 0-23, IST
  views: number;
}

export async function getViewsByHour(days: DayRange, authorFilter?: string): Promise<HourlyViews[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ hour: number; views: bigint }[]>`
    SELECT EXTRACT(HOUR FROM (v."viewedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::int AS hour,
           COUNT(*)::bigint AS views
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE v."viewedAt" >= ${since}
    ${authorFrag}
    GROUP BY hour
    ORDER BY hour ASC
  `;
  const counts = new Map(rows.map((r) => [Number(r.hour), Number(r.views)]));
  return Array.from({ length: 24 }, (_, hour) => ({ hour, views: counts.get(hour) ?? 0 }));
}

export interface LabeledCount {
  label: string;
  value: number;
}

export async function getViewsByCountry(days: DayRange, authorFilter?: string, limit = 10): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const rows = await prisma.articleView.groupBy({
    by: ["country"],
    where: { viewedAt: { gte: since }, country: { not: null }, article: bylineWhere(authorFilter) },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNames = null;
  }

  return rows.map((r) => ({
    label: (r.country && regionNames?.of(r.country)) || r.country || "Unknown",
    value: r._count.id,
  }));
}

export async function getViewsByCategory(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ category: string; views: bigint }[]>`
    SELECT c.name AS category, COUNT(v.id)::bigint AS views
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    JOIN "Category" c ON c.id = a."categoryId"
    WHERE v."viewedAt" >= ${since}
    ${authorFrag}
    GROUP BY c.name
    ORDER BY views DESC
  `;
  return rows.map((r) => ({ label: r.category, value: Number(r.views) }));
}

const REFERRER_RULES: [RegExp, string][] = [
  [/google/, "Google"],
  [/facebook|fb\.com|fb\.me/, "Facebook"],
  [/instagram/, "Instagram"],
  [/twitter|x\.com|t\.co/, "X / Twitter"],
  [/whatsapp|wa\.me/, "WhatsApp"],
  [/linkedin/, "LinkedIn"],
  [/bing|yahoo|duckduckgo/, "Other Search"],
];

function bucketReferrer(host: string | null): string {
  if (!host) return "Direct";
  const lower = host.toLowerCase();
  for (const [pattern, label] of REFERRER_RULES) {
    if (pattern.test(lower)) return label;
  }
  return "Other";
}

export async function getReferrerBreakdown(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const rows = await prisma.articleView.groupBy({
    by: ["referrerHost"],
    where: { viewedAt: { gte: since }, article: bylineWhere(authorFilter) },
    _count: { id: true },
  });

  const buckets = new Map<string, number>();
  for (const r of rows) {
    const label = bucketReferrer(r.referrerHost);
    buckets.set(label, (buckets.get(label) ?? 0) + r._count.id);
  }
  return Array.from(buckets, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export async function getDeviceBreakdown(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const rows = await prisma.articleView.groupBy({
    by: ["deviceType"],
    where: { viewedAt: { gte: since }, article: bylineWhere(authorFilter) },
    _count: { id: true },
  });
  return rows
    .map((r) => ({
      label: r.deviceType ? r.deviceType[0].toUpperCase() + r.deviceType.slice(1) : "Unknown",
      value: r._count.id,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface TopArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  views: number;
}

export async function getTopArticles(days: DayRange, authorFilter?: string, limit = 10): Promise<TopArticle[]> {
  const since = rangeStart(days);
  const grouped = await prisma.articleView.groupBy({
    by: ["articleId"],
    where: { viewedAt: { gte: since }, article: bylineWhere(authorFilter) },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const articles = await prisma.article.findMany({
    where: { id: { in: grouped.map((g) => g.articleId) } },
    select: { id: true, title: true, slug: true, category: { select: { name: true } } },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));

  return grouped
    .map((g) => {
      const article = byId.get(g.articleId);
      if (!article) return null;
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category.name,
        views: g._count.id,
      };
    })
    .filter((a): a is TopArticle => a !== null);
}

export async function getShareBreakdown(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const rows = await prisma.shareClick.groupBy({
    by: ["platform"],
    where: { createdAt: { gte: since }, article: bylineWhere(authorFilter) },
    _count: { id: true },
  });
  return rows.map((r) => ({ label: r.platform, value: r._count.id })).sort((a, b) => b.value - a.value);
}

export interface VisitorLoyalty {
  newVisitors: number;
  returningVisitors: number;
}

export async function getVisitorLoyalty(days: DayRange, authorFilter?: string): Promise<VisitorLoyalty> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ returning: bigint; new_visitors: bigint }[]>`
    WITH visitor_first_seen AS (
      SELECT v."visitorId", MIN(v."viewedAt") AS first_seen
      FROM "ArticleView" v
      JOIN "Article" a ON a.id = v."articleId"
      LEFT JOIN "User" u ON u.id = a."authorId"
      WHERE v."visitorId" IS NOT NULL
      ${authorFrag}
      GROUP BY v."visitorId"
    ),
    active_this_period AS (
      SELECT DISTINCT v."visitorId"
      FROM "ArticleView" v
      JOIN "Article" a ON a.id = v."articleId"
      LEFT JOIN "User" u ON u.id = a."authorId"
      WHERE v."visitorId" IS NOT NULL AND v."viewedAt" >= ${since}
      ${authorFrag}
    )
    SELECT
      SUM(CASE WHEN vfs.first_seen < ${since} THEN 1 ELSE 0 END)::bigint AS returning,
      SUM(CASE WHEN vfs.first_seen >= ${since} THEN 1 ELSE 0 END)::bigint AS new_visitors
    FROM active_this_period ap
    JOIN visitor_first_seen vfs ON vfs."visitorId" = ap."visitorId"
  `;
  const row = rows[0];
  return {
    newVisitors: row ? Number(row.new_visitors) : 0,
    returningVisitors: row ? Number(row.returning) : 0,
  };
}

const PUBLISH_CURVE_MAX_DAY = 13; // 0..13 individually, 14+ folded into one bucket

export async function getViewsSincePublish(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ day_offset: bigint; views: bigint }[]>`
    SELECT
      LEAST(FLOOR(EXTRACT(EPOCH FROM (v."viewedAt" - a."publishedAt")) / 86400)::int, ${PUBLISH_CURVE_MAX_DAY + 1}) AS day_offset,
      COUNT(*)::bigint AS views
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE v."viewedAt" >= ${since}
      AND a."publishedAt" IS NOT NULL
      AND v."viewedAt" >= a."publishedAt"
    ${authorFrag}
    GROUP BY day_offset
    ORDER BY day_offset ASC
  `;
  // day_offset comes back as BigInt (Postgres infers int8 for the LEAST(...) result here) —
  // must coerce before using as a plain-number Map key, or every lookup below silently misses.
  const counts = new Map(rows.map((r) => [Number(r.day_offset), Number(r.views)]));
  return Array.from({ length: PUBLISH_CURVE_MAX_DAY + 2 }, (_, day) => ({
    label: day > PUBLISH_CURVE_MAX_DAY ? `Day ${PUBLISH_CURVE_MAX_DAY + 1}+` : `Day ${day}`,
    value: counts.get(day) ?? 0,
  }));
}

export interface ReadCompletion {
  avgScrollPct: number;
  avgActiveSeconds: number;
  completionRate: number; // % of tracked views that reached 80%+ scroll
  trackedViews: number; // how many views actually have scroll data — 0 means "no data yet", not "0%"
}

export async function getReadCompletion(days: DayRange, authorFilter?: string): Promise<ReadCompletion> {
  const since = rangeStart(days);
  const articleWhere = bylineWhere(authorFilter);

  const [agg, completed] = await Promise.all([
    prisma.articleView.aggregate({
      where: { viewedAt: { gte: since }, maxScrollPct: { not: null }, article: articleWhere },
      _avg: { maxScrollPct: true, activeSeconds: true },
      _count: { id: true },
    }),
    prisma.articleView.count({
      where: { viewedAt: { gte: since }, maxScrollPct: { gte: 80 }, article: articleWhere },
    }),
  ]);

  const tracked = agg._count.id;
  return {
    avgScrollPct: Math.round(agg._avg.maxScrollPct ?? 0),
    avgActiveSeconds: Math.round(agg._avg.activeSeconds ?? 0),
    completionRate: tracked > 0 ? Math.round((completed / tracked) * 100) : 0,
    trackedViews: tracked,
  };
}
