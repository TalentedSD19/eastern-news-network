"use client";

import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; views: number; weightedAvg: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// dateStr is a plain "yyyy-mm-dd" UTC calendar bucket — parse it as text, never through
// `new Date(dateStr)` + local formatting, which shifts the displayed day for any viewer
// west of UTC (midnight UTC renders as the previous day's evening in their timezone).
function formatDayLabel(dateStr: string, withYear = false): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return withYear ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`;
}

function TrendTooltip({
  active,
  label,
  views,
  weightedAvg,
}: {
  active?: boolean;
  label?: string;
  views?: number;
  weightedAvg?: number;
}) {
  if (!active || views === undefined) return null;
  return (
    <div className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 shadow-lg text-sm">
      {label && <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{formatDayLabel(label, true)}</p>}
      <p className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ backgroundColor: "var(--chart-series)" }} />
        <span className="font-semibold text-gray-900 dark:text-gray-50">{views.toLocaleString()}</span>
        <span className="text-gray-500 dark:text-gray-400">views</span>
      </p>
      {weightedAvg !== undefined && (
        <p className="flex items-center gap-1.5 mt-0.5">
          <span
            className="inline-block w-2.5 h-0.5 border-t-2 border-dotted"
            style={{ borderColor: "var(--chart-series)" }}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-50">{weightedAvg.toLocaleString()}</span>
          <span className="text-gray-500 dark:text-gray-400">7-day weighted avg</span>
        </p>
      )}
    </div>
  );
}

export default function TrendAreaChart({ data }: Props) {
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 8) : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: "var(--chart-series)" }} />
          Daily views
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 border-t-2 border-dotted"
            style={{ borderColor: "var(--chart-series)" }}
          />
          7-day weighted average
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--chart-gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDayLabel(d)}
            interval={tickInterval}
            tick={{ fill: "var(--chart-ink-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--chart-axis)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--chart-ink-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
            content={({ active, payload, label }) => (
              <TrendTooltip
                active={active}
                label={label ? String(label) : undefined}
                views={payload?.find((p) => p.dataKey === "views")?.value as number | undefined}
                weightedAvg={payload?.find((p) => p.dataKey === "weightedAvg")?.value as number | undefined}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="var(--chart-series)"
            strokeWidth={2}
            fill="var(--chart-series-fill)"
            activeDot={{ r: 4, stroke: "var(--chart-series)", strokeWidth: 2, fill: "var(--chart-series)" }}
          />
          <Line
            type="monotone"
            dataKey="weightedAvg"
            stroke="var(--chart-series)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
