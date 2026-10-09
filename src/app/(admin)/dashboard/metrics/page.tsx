import Link from "next/link";
import {
  BookOpenCheck,
  CalendarClock,
  Clock,
  Globe,
  ImageIcon,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  ScrollText,
  Share2,
  Signpost,
  Smartphone,
  ThumbsDown,
  ThumbsUp,
  CalendarDays,
  MapPin,
  Award,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import MetricsStatCard, { DeltaBadge, MeterBar } from "@/components/admin/MetricsStatCard";
import MetricsPanel, { SectionHeading } from "@/components/admin/MetricsPanel";
import RankedList from "@/components/admin/RankedList";
import DeviceSplit from "@/components/admin/DeviceSplit";
import AuthorFilterSelect from "@/components/admin/AuthorFilterSelect";
import TrendAreaChart from "@/components/admin/charts/TrendAreaChart";
import ColumnChart from "@/components/admin/charts/ColumnChart";
import ViewsSparkline from "@/components/admin/charts/ViewsSparkline";
import AuthorLeaderboard from "@/components/admin/AuthorLeaderboard";
import ArticleScoreList from "@/components/admin/ArticleScoreList";
import {
  type DayRange,
  getOverallStats,
  getViewsOverTime,
  getViewsByHour,
  getViewsByCountry,
  getViewsByCategory,
  getReferrerBreakdown,
  getDeviceBreakdown,
  getTopArticles,
  getAuthorList,
  getShareBreakdown,
  getVisitorLoyalty,
  getViewsSincePublish,
  getReadCompletion,
  getViewsByRegion,
  getViewsByWeekday,
  getAuthorLeaderboard,
  getMostDiscussed,
  getBestCompletion,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE = "30d";

type RangeOption = { value: string; days: DayRange; label: string; short: string };

// Computed per-request (not module scope) so "year-to-date" always reflects today's date
// rather than freezing at whenever this server process last started.
function buildRanges(): RangeOption[] {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const daysSinceStartOfYear = Math.max(1, Math.ceil((Date.now() - startOfYear) / 86_400_000));

  return [
    { value: "7d", days: 7, label: "Last 7 days", short: "7 days" },
    { value: "30d", days: 30, label: "Last 30 days", short: "30 days" },
    { value: "90d", days: 90, label: "Last 90 days", short: "90 days" },
    { value: "ytd", days: daysSinceStartOfYear, label: "This year", short: "This year" },
  ];
}

function formatSeconds(total: number): string {
  if (total <= 0) return "0s";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// 0 → "12am", 13 → "1pm"
function hourLabel(hour: number): string {
  return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
}

const WEEKDAY_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: { days?: string; author?: string };
}) {
  const RANGES = buildRanges();
  const activeValue = RANGES.some((r) => r.value === searchParams.days) ? searchParams.days! : DEFAULT_RANGE;
  const activeRange = RANGES.find((r) => r.value === activeValue)!;
  const days = activeRange.days;

  const authorList = await getAuthorList();
  const activeAuthor = authorList.includes(searchParams.author ?? "") ? searchParams.author : undefined;

  const [
    stats,
    viewsOverTime,
    viewsByHour,
    viewsByCountry,
    viewsByCategory,
    referrers,
    devices,
    topArticles,
    shares,
    loyalty,
    publishCurve,
    readCompletion,
    viewsByRegion,
    viewsByWeekday,
    authors,
    mostDiscussed,
    bestCompletion,
  ] = await Promise.all([
    getOverallStats(days, activeAuthor),
    getViewsOverTime(days, activeAuthor),
    getViewsByHour(days, activeAuthor),
    getViewsByCountry(days, activeAuthor),
    getViewsByCategory(days, activeAuthor),
    getReferrerBreakdown(days, activeAuthor),
    getDeviceBreakdown(days, activeAuthor),
    getTopArticles(days, activeAuthor, 10),
    getShareBreakdown(days, activeAuthor),
    getVisitorLoyalty(days, activeAuthor),
    getViewsSincePublish(days, activeAuthor),
    getReadCompletion(days, activeAuthor),
    getViewsByRegion(days, activeAuthor, 8),
    getViewsByWeekday(days, activeAuthor),
    getAuthorLeaderboard(days),
    getMostDiscussed(days, activeAuthor),
    getBestCompletion(days, activeAuthor),
  ]);

  const deltaPct =
    stats.previousPeriodViews !== null && stats.previousPeriodViews > 0
      ? ((stats.periodViews - stats.previousPeriodViews) / stats.previousPeriodViews) * 100
      : undefined;

  const reactions = stats.upVotes + stats.downVotes + stats.comments;
  const engagementRate = stats.periodViews > 0 ? (reactions / stats.periodViews) * 100 : undefined;
  const totalVotes = stats.upVotes + stats.downVotes;
  const hasReadData = readCompletion.trackedViews > 0;
  const viewsPerVisitor = stats.uniqueVisitors > 0 ? stats.periodViews / stats.uniqueVisitors : 0;

  // Takeaways shown above the charts, so nobody has to read the chart to get the point.
  const peakHour = viewsByHour.reduce((best, h) => (h.views > best.views ? h : best), viewsByHour[0]);
  const curveTotal = publishCurve.reduce((sum, d) => sum + d.value, 0);
  const firstDayShare = pct(publishCurve[0]?.value ?? 0, curveTotal);
  const topSource = referrers.sources[0];
  const totalReferred = referrers.sources.reduce((sum, d) => sum + d.value, 0);
  const topCategory = viewsByCategory[0];
  const maxTopViews = topArticles[0]?.views ?? 0;
  const peakWeekday = viewsByWeekday.reduce((best, d) => (d.value > best.value ? d : best), viewsByWeekday[0]);
  const publishedInPeriod = activeAuthor
    ? (authors.find((a) => a.byline === activeAuthor)?.published ?? 0)
    : authors.reduce((sum, a) => sum + a.published, 0);
  const activeAuthorRank = activeAuthor ? authors.findIndex((a) => a.byline === activeAuthor) + 1 : 0;
  const activeAuthorStats = activeAuthorRank > 0 ? authors[activeAuthorRank - 1] : undefined;

  function rangeHref(value: string) {
    const params = new URLSearchParams();
    if (value !== DEFAULT_RANGE) params.set("days", value);
    if (activeAuthor) params.set("author", activeAuthor);
    const qs = params.toString();
    return qs ? `/dashboard/metrics?${qs}` : "/dashboard/metrics";
  }

  function authorHref(byline: string) {
    const params = new URLSearchParams();
    if (activeValue !== DEFAULT_RANGE) params.set("days", activeValue);
    params.set("author", byline);
    return `/dashboard/metrics?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      {/* Header + filters */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-medium tracking-tight text-2xl">Metrics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            How{" "}
            {activeAuthor ? (
              <>
                <strong className="font-semibold text-gray-700 dark:text-gray-200">{activeAuthor}</strong>&apos;s
              </>
            ) : (
              "your"
            )}{" "}
            stories are doing · {activeRange.label.toLowerCase()} · {publishedInPeriod.toLocaleString()} new{" "}
            {publishedInPeriod === 1 ? "article" : "articles"} ({stats.publishedArticles.toLocaleString()} published in all)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AuthorFilterSelect authors={authorList} activeAuthor={activeAuthor} />
          <nav
            aria-label="Time period"
            className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-neutral-900 p-0.5"
          >
            {RANGES.map((r) => (
              <Link
                key={r.value}
                href={rangeHref(r.value)}
                aria-current={activeValue === r.value ? "page" : undefined}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                  activeValue === r.value
                    ? "bg-brand-accent text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                {r.short}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {activeAuthor && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] px-4 py-3 text-sm">
          <Award className="size-4 text-brand-accent shrink-0" />
          <p className="flex-1 min-w-0 text-gray-700 dark:text-gray-200">
            {activeAuthorStats && activeAuthorStats.views > 0 ? (
              <>
                <strong className="font-semibold">{activeAuthor}</strong> is{" "}
                <strong className="font-semibold">#{activeAuthorRank}</strong> of {authors.length} authors by views{" "}
                {activeRange.label.toLowerCase()}
                {activeAuthorStats.completionRate !== null && (
                  <> · {activeAuthorStats.completionRate}% of their readers finish the article</>
                )}
                .
              </>
            ) : (
              <>
                No views for <strong className="font-semibold">{activeAuthor}</strong> {activeRange.label.toLowerCase()}.
              </>
            )}
          </p>
          <Link href={activeValue === DEFAULT_RANGE ? "/dashboard/metrics" : `/dashboard/metrics?days=${activeValue}`} className="text-xs font-semibold text-brand-accent hover:underline">
            Show everyone
          </Link>
        </div>
      )}

      {/* Readers — headline numbers paired with the trend */}
      <section className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-gray-100 dark:divide-white/10 lg:divide-x border-b border-gray-100 dark:border-white/10">
          <HeroStat
            label="Views"
            value={stats.periodViews}
            hint={
              deltaPct !== undefined
                ? `vs ${stats.previousPeriodViews!.toLocaleString()} in the period before`
                : "Times an article was opened"
            }
            badge={deltaPct !== undefined ? <DeltaBadge pct={deltaPct} periodLabel="the period before" /> : undefined}
          />
          <HeroStat
            label="Readers"
            value={stats.uniqueVisitors}
            hint={viewsPerVisitor > 0 ? `Each read ${viewsPerVisitor.toFixed(1)} articles on average` : "Different people who visited"}
          />
          <HeroStat
            label="New readers"
            value={loyalty.newVisitors}
            hint={`${pct(loyalty.newVisitors, loyalty.newVisitors + loyalty.returningVisitors)}% visiting for the first time`}
          />
          <HeroStat
            label="Returning readers"
            value={loyalty.returningVisitors}
            hint="Had visited before this period"
          />
        </div>
        <div className="p-5 sm:p-6">
          <TrendAreaChart data={viewsOverTime} />
        </div>
      </section>

      {/* Top stories */}
      <section>
        <SectionHeading title="Top stories" description={`Most-read articles · ${activeRange.label.toLowerCase()}`} />
        <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
          {topArticles.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No views recorded for this period yet.</p>
          ) : (
            <ol className="divide-y divide-gray-100 dark:divide-white/5">
              {topArticles.map((a, i) => (
                <li key={a.id} className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <span
                    className={cn(
                      "w-5 shrink-0 text-right font-display text-lg tabular-nums",
                      i < 3 ? "text-brand-accent" : "text-gray-300 dark:text-gray-600"
                    )}
                  >
                    {i + 1}
                  </span>
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
                  <div className="min-w-0 flex-1">
                    {/* Stretched link: the whole row opens the article's metrics */}
                    <Link
                      href={`/dashboard/articles/${a.id}/metrics`}
                      className="block font-medium truncate hover:text-brand-accent transition-colors after:absolute after:inset-0"
                      title={a.title}
                    >
                      {a.title}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{a.byline}</span>
                      <span className="text-gray-300 dark:text-gray-600 mx-1.5">·</span>
                      {a.category}
                      {a.publishedAt && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600 mx-1.5">·</span>
                          {formatDate(a.publishedAt)}
                        </>
                      )}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden max-w-xs">
                      <div
                        className="h-full rounded-full bg-brand-accent/60"
                        style={{ width: `${Math.max(2, (a.views / maxTopViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Above the stretched link so the sparkline tooltip still works */}
                  <div className="relative z-10 hidden lg:block shrink-0" title="Daily views since published">
                    <ViewsSparkline data={a.daily} width={120} />
                  </div>
                  <div className="shrink-0 w-16 sm:w-20 text-right">
                    <p className="font-display text-lg font-medium tabular-nums leading-tight">{a.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">views</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Reading quality */}
      <section>
        <SectionHeading title="How people read" description="Whether readers stay with the story and react to it" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <MetricsStatCard
            label="Read to the end"
            icon={BookOpenCheck}
            value={`${readCompletion.completionRate}%`}
            empty={hasReadData ? undefined : "Not enough reading data yet."}
            hint="Share of readers who scrolled through at least 80% of the article."
          >
            <MeterBar pct={readCompletion.completionRate} label="Read to the end" />
          </MetricsStatCard>
          <MetricsStatCard
            label="How far they scroll"
            icon={ScrollText}
            value={`${readCompletion.avgScrollPct}%`}
            empty={hasReadData ? undefined : "Not enough reading data yet."}
            hint="On average, readers get this far down an article."
          >
            <MeterBar pct={readCompletion.avgScrollPct} label="Average scroll depth" />
          </MetricsStatCard>
          <MetricsStatCard
            label="Time spent reading"
            icon={Clock}
            value={formatSeconds(readCompletion.avgActiveSeconds)}
            empty={hasReadData ? undefined : "Not enough reading data yet."}
            hint="Average time a reader actively spends on an article (idle tabs don't count)."
          />
          <MetricsStatCard
            label="Reactions"
            icon={MousePointerClick}
            value={engagementRate !== undefined ? `${engagementRate.toFixed(1)}%` : "—"}
            hint={`${reactions.toLocaleString()} votes and comments — the share of views that led to one.`}
          />
          <MetricsStatCard
            label="Votes"
            icon={ThumbsUp}
            value={totalVotes}
            hint={totalVotes > 0 ? `${pct(stats.upVotes, totalVotes)}% of votes were positive.` : "No votes in this period."}
          >
            {totalVotes > 0 && (
              <div>
                <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5" aria-hidden>
                  <div className="bg-emerald-500" style={{ width: `${pct(stats.upVotes, totalVotes)}%` }} />
                  <div className="bg-rose-500" style={{ width: `${100 - pct(stats.upVotes, totalVotes)}%` }} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs tabular-nums">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <ThumbsUp className="size-3.5" /> {stats.upVotes.toLocaleString()} up
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                    <ThumbsDown className="size-3.5" /> {stats.downVotes.toLocaleString()} down
                  </span>
                </div>
              </div>
            )}
          </MetricsStatCard>
          <MetricsStatCard
            label="Comments"
            icon={MessageSquare}
            value={stats.comments}
            hint="New comments left on articles in this period."
          />
        </div>
      </section>

      {/* Stories that connected */}
      <section>
        <SectionHeading title="Stories that connected" description="Beyond views: the articles people talked about and read all the way through" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <MetricsPanel title="Most discussed" subtitle="Most votes and comments in this period" icon={MessageSquare}>
            <ArticleScoreList
              emptyMessage="No votes or comments in this period yet."
              items={mostDiscussed.map((a) => ({
                id: a.id,
                title: a.title,
                byline: a.byline,
                value: a.value.toLocaleString(),
                detail: `${a.basis.toLocaleString()} ${a.basis === 1 ? "comment" : "comments"}`,
              }))}
            />
          </MetricsPanel>
          <MetricsPanel title="Read to the end" subtitle="Highest share of readers who finished (articles with 20+ tracked reads)" icon={BookOpenCheck}>
            <ArticleScoreList
              emptyMessage="Not enough reading data in this period yet."
              items={bestCompletion.map((a) => ({
                id: a.id,
                title: a.title,
                byline: a.byline,
                value: `${a.value}%`,
                detail: `of ${a.basis.toLocaleString()} reads`,
              }))}
            />
          </MetricsPanel>
        </div>
      </section>

      {/* Authors — hidden when the page is already filtered to one */}
      {!activeAuthor && (
        <section>
          <SectionHeading title="Authors" description={`Who drew readers ${activeRange.label.toLowerCase()} · click a name to see only their stories`} />
          <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
            <AuthorLeaderboard authors={authors} authorHref={authorHref} />
          </div>
        </section>
      )}

      {/* Audience */}
      <section>
        <SectionHeading title="Where readers come from" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="grid gap-4">
            <MetricsPanel
              title="How they found us"
              subtitle="The site or app a reader came from"
              icon={Signpost}
              insight={
                topSource && totalReferred > 0 ? (
                  <>
                    <strong className="font-semibold">{topSource.label}</strong> brought in{" "}
                    {pct(topSource.value, totalReferred)}% of views.
                  </>
                ) : undefined
              }
            >
              <RankedList data={referrers.sources} emptyMessage="No sources recorded for this period yet." />
              {referrers.untracked > 0 && (
                <p className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
                  {referrers.untracked.toLocaleString()} older {referrers.untracked === 1 ? "view was" : "views were"}{" "}
                  recorded before sources were tracked, so {referrers.untracked === 1 ? "it isn't" : "they aren't"} counted here.
                </p>
              )}
            </MetricsPanel>
            <MetricsPanel title="Devices" subtitle="What people read on" icon={Smartphone}>
              <DeviceSplit data={devices} />
            </MetricsPanel>
          </div>
          <div className="grid gap-4">
            <MetricsPanel title="Countries" subtitle="Top countries by views" icon={Globe}>
              <RankedList data={viewsByCountry} showShare={false} limit={6} />
            </MetricsPanel>
            <MetricsPanel title="States and regions" subtitle="Top regions by views" icon={MapPin}>
              <RankedList data={viewsByRegion} showShare={false} limit={8} emptyMessage="No region data for this period yet." />
            </MetricsPanel>
          </div>
        </div>
      </section>

      {/* Timing */}
      <section>
        <SectionHeading title="When they read" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MetricsPanel
            title="Time of day"
            subtitle="Views by hour, Indian Standard Time"
            icon={Clock}
            insight={
              peakHour && peakHour.views > 0 ? (
                <>
                  Busiest between <strong className="font-semibold">{hourLabel(peakHour.hour)}</strong> and{" "}
                  <strong className="font-semibold">{hourLabel((peakHour.hour + 1) % 24)}</strong> — a good time to publish.
                </>
              ) : undefined
            }
          >
            <ColumnChart
              data={viewsByHour.map((h) => ({
                label: hourLabel(h.hour),
                tooltipLabel: `${hourLabel(h.hour)} – ${hourLabel((h.hour + 1) % 24)}`,
                value: h.views,
              }))}
              highlightIndex={peakHour && peakHour.views > 0 ? peakHour.hour : undefined}
              tickInterval={2}
            />
          </MetricsPanel>
          <MetricsPanel
            title="Day of the week"
            subtitle="Views by day, Indian Standard Time"
            icon={CalendarDays}
            insight={
              peakWeekday && peakWeekday.value > 0 ? (
                <>
                  <strong className="font-semibold">{WEEKDAY_NAMES[peakWeekday.label] ?? peakWeekday.label}</strong> is the busiest day.
                </>
              ) : undefined
            }
          >
            <ColumnChart
              data={viewsByWeekday.map((d) => ({ ...d, tooltipLabel: WEEKDAY_NAMES[d.label] }))}
              highlightIndex={peakWeekday && peakWeekday.value > 0 ? viewsByWeekday.indexOf(peakWeekday) : undefined}
            />
          </MetricsPanel>
          <MetricsPanel
            className="lg:col-span-2"
            title="Shelf life"
            subtitle="Views by days since the article was published"
            icon={CalendarClock}
            insight={
              curveTotal > 0 ? (
                <>
                  <strong className="font-semibold">{firstDayShare}%</strong> of views come on the day an article is published.
                </>
              ) : undefined
            }
          >
            <ColumnChart
              data={publishCurve.map((d, i) => ({
                label: i === publishCurve.length - 1 ? `${i + 1}+` : String(i + 1),
                tooltipLabel:
                  i === 0
                    ? "Day 1 (first 24 hours)"
                    : i === publishCurve.length - 1
                      ? `Day ${i + 1} and later`
                      : `Day ${i + 1}`,
                value: d.value,
              }))}
              highlightIndex={0}
            />
          </MetricsPanel>
        </div>
      </section>

      {/* Topics & sharing */}
      <section>
        <SectionHeading title="What they read and share" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <MetricsPanel
            title="Categories"
            subtitle="Which sections draw the most views"
            icon={LayoutGrid}
            insight={
              topCategory && stats.periodViews > 0 ? (
                <>
                  <strong className="font-semibold">{topCategory.label}</strong> is the most-read section.
                </>
              ) : undefined
            }
          >
            <RankedList data={viewsByCategory} limit={10} />
          </MetricsPanel>
          <MetricsPanel title="Shared to" subtitle="Where readers shared articles using the share buttons" icon={Share2}>
            <RankedList data={shares} valueSuffix="shares" emptyMessage="No shares in this period yet." />
          </MetricsPanel>
        </div>
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: number;
  hint: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="p-5 sm:p-6 min-w-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 border-gray-100 dark:border-white/10 even:border-l lg:even:border-l-0">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap mt-1">
        <p className="text-3xl font-display font-medium tracking-tight tabular-nums">{value.toLocaleString()}</p>
        {badge}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{hint}</p>
    </div>
  );
}
