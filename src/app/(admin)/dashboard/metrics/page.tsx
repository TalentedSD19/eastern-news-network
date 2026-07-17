import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MetricsStatCard from "@/components/admin/MetricsStatCard";
import AuthorFilterSelect from "@/components/admin/AuthorFilterSelect";
import TrendAreaChart from "@/components/admin/charts/TrendAreaChart";
import RankedBarChart from "@/components/admin/charts/RankedBarChart";
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
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE = "30d";

type RangeOption = { value: string; days: DayRange; label: string };

// Computed per-request (not module scope) so "year-to-date" always reflects today's date
// rather than freezing at whenever this server process last started.
function buildRanges(): RangeOption[] {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const daysSinceStartOfYear = Math.max(1, Math.ceil((Date.now() - startOfYear) / 86_400_000));

  return [
    { value: "7d", days: 7, label: "Last 7 days" },
    { value: "30d", days: 30, label: "Last 30 days" },
    { value: "90d", days: 90, label: "Last 90 days" },
    { value: "ytd", days: daysSinceStartOfYear, label: "Year-to-date" },
  ];
}

function formatSeconds(total: number): string {
  if (total <= 0) return "0s";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm p-6">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: { days?: string; author?: string };
}) {
  const RANGES = buildRanges();
  const activeValue = RANGES.some((r) => r.value === searchParams.days) ? searchParams.days! : DEFAULT_RANGE;
  const days = RANGES.find((r) => r.value === activeValue)!.days;

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
  ]);

  const deltaPct =
    stats.previousPeriodViews !== null && stats.previousPeriodViews > 0
      ? ((stats.periodViews - stats.previousPeriodViews) / stats.previousPeriodViews) * 100
      : undefined;

  const engagementRate =
    stats.periodViews > 0
      ? ((stats.upVotes + stats.downVotes + stats.comments) / stats.periodViews) * 100
      : undefined;

  const rangeLabel = RANGES.find((r) => r.value === activeValue)?.label ?? "Last 30 days";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold">Metrics</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <AuthorFilterSelect authors={authorList} activeAuthor={activeAuthor} />
          <div className="flex items-center gap-1.5">
            {RANGES.map((r) => {
              const params = new URLSearchParams();
              if (r.value !== DEFAULT_RANGE) params.set("days", r.value);
              if (activeAuthor) params.set("author", activeAuthor);
              const qs = params.toString();
              return (
                <Link
                  key={r.value}
                  href={qs ? `/dashboard/metrics?${qs}` : "/dashboard/metrics"}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    activeValue === r.value
                      ? "bg-brand-red text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                  )}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI row 1 — audience */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricsStatCard
          label="Views"
          value={stats.periodViews.toLocaleString()}
          delta={deltaPct !== undefined ? { pct: deltaPct, periodLabel: "previous period" } : undefined}
        />
        <MetricsStatCard label="Unique visitors" value={stats.uniqueVisitors.toLocaleString()} />
        <MetricsStatCard label="New visitors" value={loyalty.newVisitors.toLocaleString()} />
        <MetricsStatCard label="Returning visitors" value={loyalty.returningVisitors.toLocaleString()} />
        <MetricsStatCard label="Published articles" value={stats.publishedArticles.toLocaleString()} />
      </div>

      {/* KPI row 2 — engagement & read quality */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricsStatCard
          label="Engagement rate"
          value={engagementRate !== undefined ? `${engagementRate.toFixed(1)}%` : "—"}
        />
        <MetricsStatCard
          label="Avg. scroll depth"
          value={readCompletion.trackedViews > 0 ? `${readCompletion.avgScrollPct}%` : "No data yet"}
        />
        <MetricsStatCard
          label="Read completion"
          value={readCompletion.trackedViews > 0 ? `${readCompletion.completionRate}%` : "No data yet"}
        />
        <MetricsStatCard
          label="Avg. active read time"
          value={readCompletion.trackedViews > 0 ? formatSeconds(readCompletion.avgActiveSeconds) : "No data yet"}
        />
        <MetricsStatCard label="Comments" value={stats.comments.toLocaleString()} />
        <MetricsStatCard label="Votes" value={`${stats.upVotes.toLocaleString()} ↑ / ${stats.downVotes.toLocaleString()} ↓`} />
      </div>

      {/* Trend */}
      <ChartCard title="Views over time" subtitle={`Daily views — ${rangeLabel}`}>
        <TrendAreaChart data={viewsOverTime} />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Traffic by hour of day" subtitle="IST — when visitors are reading">
          <RankedBarChart data={viewsByHour.map((h) => ({ label: `${h.hour}:00`, value: h.views }))} />
        </ChartCard>
        <ChartCard title="Top countries" subtitle="Where visitors are located">
          <RankedBarChart data={viewsByCountry.map((c) => ({ label: c.label, value: c.value }))} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Views by category" subtitle="Which news draws the most traffic">
          <RankedBarChart data={viewsByCategory} />
        </ChartCard>
        <ChartCard title="How visitors arrive" subtitle="Referrer / acquisition source">
          <RankedBarChart data={referrers} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="How readers re-share" subtitle="Which platform people actually use to share a piece">
          <RankedBarChart data={shares} emptyMessage="No shares recorded for this period yet." />
        </ChartCard>
        <ChartCard title="Article shelf life" subtitle="Views by days since publish (first 2 weeks)">
          <RankedBarChart data={publishCurve} />
        </ChartCard>
      </div>

      <ChartCard title="Device breakdown" subtitle="Mobile, tablet, or desktop">
        <RankedBarChart data={devices} />
      </ChartCard>

      {/* Top articles */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Top articles</h2>
        <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topArticles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 dark:text-gray-500 py-10">
                    No views recorded for this period yet.
                  </TableCell>
                </TableRow>
              )}
              {topArticles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/articles/${a.id}/metrics`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Metrics
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
