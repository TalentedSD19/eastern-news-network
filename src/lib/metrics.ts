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

  return rows.map((r) => ({ label: countryName(r.country), value: r._count.id }));
}

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

/** "IN" → "India"; falls back to the raw code. */
export function countryName(code: string | null): string {
  if (!code) return "Unknown";
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export async function getViewsByRegion(
  days: DayRange,
  authorFilter?: string,
  limit = 10
): Promise<(LabeledCount & { sublabel: string })[]> {
  const since = rangeStart(days);
  const rows = await prisma.articleView.groupBy({
    by: ["region", "country"],
    where: { viewedAt: { gte: since }, region: { not: null }, article: bylineWhere(authorFilter) },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ label: r.region!, sublabel: countryName(r.country), value: r._count.id }));
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

// Stored as ArticleView.referrerHost when a reader came from another page on this site.
export const INTERNAL_REFERRER = "internal";

const OWN_SITE_HOSTS = /(^|\.)easternnewsnetwork\.com$|^localhost$|^127\.0\.0\.1$/;

export function isOwnSiteHost(host: string): boolean {
  return OWN_SITE_HOSTS.test(host);
}

// Hosts are matched whole (or as a subdomain) so e.g. "reddit.com" isn't caught by "t.co".
// The com.* patterns are Android app referrers (android-app://com.whatsapp → "com.whatsapp").
const REFERRER_RULES: [RegExp, string][] = [
  [/(^|\.)news\.google\.|^com\.google\.android\.apps\.magazines/, "Google News"],
  [/(^|\.)google\.[a-z.]+$|^com\.google\./, "Google"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$|^com\.facebook\./, "Facebook"],
  [/(^|\.)instagram\.com$|^com\.instagram\./, "Instagram"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$|^com\.twitter\./, "X / Twitter"],
  [/(^|\.)(whatsapp\.com|whatsapp\.net|wa\.me)$|^com\.whatsapp/, "WhatsApp"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$|^com\.linkedin\./, "LinkedIn"],
  [/(^|\.)(telegram\.org|t\.me)$|^org\.telegram\./, "Telegram"],
  [/(^|\.)(youtube\.com|youtu\.be)$|^com\.google\.android\.youtube/, "YouTube"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)(bing\.com|yahoo\.com|duckduckgo\.com|ecosia\.org|yandex\.[a-z]+|baidu\.com)$/, "Other search engines"],
];

/** Label for a stored referrer host, or null for views recorded before the page sent its referrer. */
function bucketReferrer(host: string | null): { label: string; sublabel?: string } | null {
  if (!host) return { label: "Direct", sublabel: "typed address, bookmark or a link in an app" };
  if (host === INTERNAL_REFERRER) return { label: "ENN pages", sublabel: "homepage or another article" };
  const lower = host.toLowerCase();
  // Older views stored the article's own host (the tracker request's Referer), so the real source is unknown.
  if (isOwnSiteHost(lower)) return null;
  for (const [pattern, label] of REFERRER_RULES) {
    if (pattern.test(lower)) return { label };
  }
  return { label: lower.replace(/^(www|m)\./, "") };
}

export interface ReferrerBreakdown {
  sources: (LabeledCount & { sublabel?: string })[];
  /** Views recorded before referrer tracking was fixed — their source is unknown. */
  untracked: number;
}

function bucketReferrerRows(rows: { referrerHost: string | null; _count: { id: number } }[]): ReferrerBreakdown {
  const buckets = new Map<string, { value: number; sublabel?: string }>();
  let untracked = 0;
  for (const r of rows) {
    const bucket = bucketReferrer(r.referrerHost);
    if (!bucket) {
      untracked += r._count.id;
      continue;
    }
    const entry = buckets.get(bucket.label) ?? { value: 0, sublabel: bucket.sublabel };
    entry.value += r._count.id;
    buckets.set(bucket.label, entry);
  }
  const sources = Array.from(buckets, ([label, { value, sublabel }]) => ({ label, value, sublabel })).sort(
    (a, b) => b.value - a.value
  );
  return { sources, untracked };
}

export async function getReferrerBreakdown(days: DayRange, authorFilter?: string): Promise<ReferrerBreakdown> {
  const since = rangeStart(days);
  const rows = await prisma.articleView.groupBy({
    by: ["referrerHost"],
    where: { viewedAt: { gte: since }, article: bylineWhere(authorFilter) },
    _count: { id: true },
  });
  return bucketReferrerRows(rows);
}

export async function getArticleReferrers(articleId: string): Promise<ReferrerBreakdown> {
  const rows = await prisma.articleView.groupBy({
    by: ["referrerHost"],
    where: { articleId },
    _count: { id: true },
  });
  return bucketReferrerRows(rows);
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

export interface DayCount {
  date: string; // yyyy-mm-dd, UTC — same buckets as getViewsOverTime
  views: number;
}

// Daily views for each article from its publish day to today (lifetime, not limited to any
// period). Falls back to the first view for articles without a publish date; views logged
// before publishing (previews) are left out.
export async function getLifetimeDailyViews(
  articles: { id: string; publishedAt: Date | null }[]
): Promise<Map<string, DayCount[]>> {
  const series = new Map<string, DayCount[]>();
  if (articles.length === 0) return series;

  const rows = await prisma.$queryRaw<{ articleId: string; day: Date; views: bigint }[]>`
    SELECT v."articleId", date_trunc('day', v."viewedAt") AS day, COUNT(*)::bigint AS views
    FROM "ArticleView" v
    WHERE v."articleId" IN (${Prisma.join(articles.map((a) => a.id))})
    GROUP BY v."articleId", day
  `;
  const counts = new Map(rows.map((r) => [`${r.articleId}|${r.day.toISOString().slice(0, 10)}`, Number(r.views)]));
  const firstViewDay = new Map<string, number>();
  for (const r of rows) {
    const t = r.day.getTime();
    if (t < (firstViewDay.get(r.articleId) ?? Infinity)) firstViewDay.set(r.articleId, t);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const a of articles) {
    const start = new Date(a.publishedAt?.getTime() ?? firstViewDay.get(a.id) ?? today.getTime());
    start.setUTCHours(0, 0, 0, 0);
    const days: DayCount[] = [];
    for (const d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const date = d.toISOString().slice(0, 10);
      days.push({ date, views: counts.get(`${a.id}|${date}`) ?? 0 });
    }
    series.set(a.id, days);
  }
  return series;
}

// One article's lifetime daily views, in the shape TrendAreaChart takes.
export async function getArticleViewsSincePublish(article: { id: string; publishedAt: Date | null }): Promise<DailyViews[]> {
  const days = (await getLifetimeDailyViews([article])).get(article.id) ?? [];
  const views = days.map((d) => d.views);
  return days.map((d, i) => ({
    date: d.date,
    views: d.views,
    weightedAvg: Math.round(weightedMovingAverage(views, i) * 10) / 10,
  }));
}

export interface TopArticle {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  byline: string;
  category: string;
  publishedAt: Date | null;
  views: number; // within the selected period
  daily: DayCount[]; // publish day → today, not limited to the period
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
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      publishedAt: true,
      reporterName: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));
  const daily = await getLifetimeDailyViews(articles);

  return grouped
    .map((g) => {
      const article = byId.get(g.articleId);
      if (!article) return null;
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        coverImage: article.coverImage,
        byline: article.reporterName ?? article.author.name,
        category: article.category.name,
        publishedAt: article.publishedAt,
        views: g._count.id,
        daily: daily.get(article.id) ?? [],
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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Views by day of the week in IST, Monday first. */
export async function getViewsByWeekday(days: DayRange, authorFilter?: string): Promise<LabeledCount[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  // ISODOW: 1 = Monday … 7 = Sunday
  const rows = await prisma.$queryRaw<{ dow: number; views: bigint }[]>`
    SELECT EXTRACT(ISODOW FROM (v."viewedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::int AS dow,
           COUNT(*)::bigint AS views
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE v."viewedAt" >= ${since}
    ${authorFrag}
    GROUP BY dow
  `;
  const counts = new Map(rows.map((r) => [Number(r.dow), Number(r.views)]));
  return WEEKDAYS.map((label, i) => ({ label, value: counts.get(i + 1) ?? 0 }));
}

export interface AuthorStats {
  byline: string;
  published: number; // articles published within the period
  views: number; // views within the period, on any of their articles
  articlesRead: number; // how many of their articles got at least one view in the period
  completionRate: number | null; // % of tracked views that reached 80%+ scroll; null = no data
  reactions: number; // votes + comments within the period
}

// Per-byline totals for the period, most-viewed first. Same byline resolution as bylineWhere.
export async function getAuthorLeaderboard(days: DayRange): Promise<AuthorStats[]> {
  const since = rangeStart(days);
  const [viewRows, publishedRows, reactionRows] = await Promise.all([
    prisma.$queryRaw<{ byline: string; views: bigint; articles: bigint; tracked: bigint; completed: bigint }[]>`
      SELECT COALESCE(a."reporterName", u.name) AS byline,
             COUNT(*)::bigint AS views,
             COUNT(DISTINCT v."articleId")::bigint AS articles,
             COUNT(*) FILTER (WHERE v."maxScrollPct" IS NOT NULL)::bigint AS tracked,
             COUNT(*) FILTER (WHERE v."maxScrollPct" >= 80)::bigint AS completed
      FROM "ArticleView" v
      JOIN "Article" a ON a.id = v."articleId"
      LEFT JOIN "User" u ON u.id = a."authorId"
      WHERE v."viewedAt" >= ${since}
      GROUP BY byline
    `,
    prisma.$queryRaw<{ byline: string; published: bigint }[]>`
      SELECT COALESCE(a."reporterName", u.name) AS byline, COUNT(*)::bigint AS published
      FROM "Article" a
      LEFT JOIN "User" u ON u.id = a."authorId"
      WHERE a.status = 'PUBLISHED' AND a."publishedAt" >= ${since}
      GROUP BY byline
    `,
    prisma.$queryRaw<{ byline: string; reactions: bigint }[]>`
      SELECT COALESCE(a."reporterName", u.name) AS byline, COUNT(*)::bigint AS reactions
      FROM (
        SELECT "articleId" FROM "Comment" WHERE "createdAt" >= ${since}
        UNION ALL
        SELECT "articleId" FROM "Vote" WHERE "createdAt" >= ${since}
      ) r
      JOIN "Article" a ON a.id = r."articleId"
      LEFT JOIN "User" u ON u.id = a."authorId"
      GROUP BY byline
    `,
  ]);

  const stats = new Map<string, AuthorStats>();
  const entry = (byline: string) => {
    let row = stats.get(byline);
    if (!row) {
      row = { byline, published: 0, views: 0, articlesRead: 0, completionRate: null, reactions: 0 };
      stats.set(byline, row);
    }
    return row;
  };
  for (const r of viewRows) {
    const row = entry(r.byline);
    row.views = Number(r.views);
    row.articlesRead = Number(r.articles);
    const tracked = Number(r.tracked);
    row.completionRate = tracked > 0 ? Math.round((Number(r.completed) / tracked) * 100) : null;
  }
  for (const r of publishedRows) entry(r.byline).published = Number(r.published);
  for (const r of reactionRows) entry(r.byline).reactions = Number(r.reactions);

  return Array.from(stats.values()).sort((a, b) => b.views - a.views || b.published - a.published);
}

export interface ArticleScore {
  id: string;
  title: string;
  byline: string;
  value: number;
  /** Supporting number for the value: comments for "most discussed", tracked views for completion. */
  basis: number;
}

const MIN_TRACKED_VIEWS_FOR_COMPLETION = 20;

/** Articles with the most votes + comments in the period. */
export async function getMostDiscussed(days: DayRange, authorFilter?: string, limit = 5): Promise<ArticleScore[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ id: string; title: string; byline: string; comments: bigint; total: bigint }[]>`
    SELECT a.id, a.title, COALESCE(a."reporterName", u.name) AS byline,
           COUNT(*) FILTER (WHERE r.kind = 'comment')::bigint AS comments,
           COUNT(*)::bigint AS total
    FROM (
      SELECT "articleId", 'comment' AS kind FROM "Comment" WHERE "createdAt" >= ${since}
      UNION ALL
      SELECT "articleId", 'vote' AS kind FROM "Vote" WHERE "createdAt" >= ${since}
    ) r
    JOIN "Article" a ON a.id = r."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE TRUE ${authorFrag}
    GROUP BY a.id, a.title, byline
    ORDER BY total DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ id: r.id, title: r.title, byline: r.byline, value: Number(r.total), basis: Number(r.comments) }));
}

/**
 * Articles the highest share of readers finished (80%+ scroll), among those with enough
 * tracked views for the rate to mean something.
 */
export async function getBestCompletion(days: DayRange, authorFilter?: string, limit = 5): Promise<ArticleScore[]> {
  const since = rangeStart(days);
  const authorFrag = authorFilterFragment(authorFilter);
  const rows = await prisma.$queryRaw<{ id: string; title: string; byline: string; tracked: bigint; completed: bigint }[]>`
    SELECT a.id, a.title, COALESCE(a."reporterName", u.name) AS byline,
           COUNT(*)::bigint AS tracked,
           COUNT(*) FILTER (WHERE v."maxScrollPct" >= 80)::bigint AS completed
    FROM "ArticleView" v
    JOIN "Article" a ON a.id = v."articleId"
    LEFT JOIN "User" u ON u.id = a."authorId"
    WHERE v."viewedAt" >= ${since} AND v."maxScrollPct" IS NOT NULL
    ${authorFrag}
    GROUP BY a.id, a.title, byline
    HAVING COUNT(*) >= ${MIN_TRACKED_VIEWS_FOR_COMPLETION}
    ORDER BY COUNT(*) FILTER (WHERE v."maxScrollPct" >= 80)::float / COUNT(*) DESC, COUNT(*) DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    byline: r.byline,
    value: Math.round((Number(r.completed) / Number(r.tracked)) * 100),
    basis: Number(r.tracked),
  }));
}

export interface CategoryComparison {
  category: string;
  rank: number; // 1 = most-viewed published article in its category (lifetime)
  of: number; // published articles in the category
  categoryAverage: number; // average lifetime views per published article in the category
}

/** Where one article stands among the published articles in its category, by lifetime views. */
export async function getCategoryComparison(article: {
  id: string;
  categoryId: string;
  category: { name: string };
}): Promise<CategoryComparison> {
  const rows = await prisma.$queryRaw<{ id: string; views: bigint }[]>`
    SELECT a.id, COUNT(v.id)::bigint AS views
    FROM "Article" a
    LEFT JOIN "ArticleView" v ON v."articleId" = a.id
    WHERE a."categoryId" = ${article.categoryId} AND a.status = 'PUBLISHED'
    GROUP BY a.id
  `;
  const views = rows.map((r) => ({ id: r.id, views: Number(r.views) }));
  const own = views.find((r) => r.id === article.id)?.views ?? 0;
  const total = views.reduce((sum, r) => sum + r.views, 0);
  return {
    category: article.category.name,
    rank: views.filter((r) => r.views > own).length + 1,
    of: views.length,
    categoryAverage: views.length > 0 ? total / views.length : 0,
  };
}
