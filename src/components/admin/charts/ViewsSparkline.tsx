"use client";

import { useId } from "react";
import { AreaChart, Area, Tooltip, YAxis } from "recharts";
import { formatDayLabel } from "./TrendAreaChart";

interface Props {
  data: { date: string; views: number }[];
  width?: number;
  height?: number;
}

// Compact one-line tooltip so it fits inside a table row instead of spilling over neighbours.
function SparkTooltip({ active, date, views }: { active?: boolean; date?: string; views?: number }) {
  if (!active || !date || views === undefined) return null;
  return (
    <div className="whitespace-nowrap rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 px-1.5 py-0.5 text-[11px] shadow-md">
      <span className="text-gray-500 dark:text-gray-400">{formatDayLabel(date, true)}</span>
      <span className="ml-1.5 font-semibold tabular-nums text-gray-900 dark:text-gray-50">{views.toLocaleString()}</span>
    </div>
  );
}

// Daily views for a table row, with the date + count on hover.
export default function ViewsSparkline({ data: raw, width = 150, height = 36 }: Props) {
  // useId output contains ":" which breaks url(#…) references.
  const gradientId = `spark-fill-${useId().replace(/:/g, "")}`;
  if (raw.length === 0) return null;
  // A single day (published today) has no line to draw — repeat it so it shows flat.
  const data = raw.length === 1 ? [raw[0], raw[0]] : raw;

  return (
    <AreaChart width={width} height={height} data={data} margin={{ top: 3, right: 3, bottom: 1, left: 3 }} className="inline-block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-series)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--chart-series)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <YAxis hide domain={[0, "dataMax"]} />
      <Tooltip
        cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
        isAnimationActive={false}
        // Pinned to the top of the chart and kept within its width, so the first and last
        // rows of the table don't clip it.
        position={{ y: -26 }}
        allowEscapeViewBox={{ x: false, y: true }}
        wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
        content={({ active, payload }) => {
          const point = payload?.[0]?.payload as { date: string; views: number } | undefined;
          return <SparkTooltip active={active} date={point?.date} views={point?.views} />;
        }}
      />
      <Area
        type="monotone"
        dataKey="views"
        stroke="var(--chart-series)"
        strokeWidth={1.5}
        fill={`url(#${gradientId})`}
        isAnimationActive={false}
        activeDot={{ r: 3, stroke: "hsl(var(--card))", strokeWidth: 1.5, fill: "var(--chart-series)" }}
      />
    </AreaChart>
  );
}
