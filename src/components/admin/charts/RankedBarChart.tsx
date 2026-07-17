"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import ChartTooltip from "./ChartTooltip";

interface Props {
  data: { label: string; value: number }[];
  valueSuffix?: string;
  emptyMessage?: string;
}

export default function RankedBarChart({ data, valueSuffix = "views", emptyMessage = "No data yet." }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const longestLabel = Math.max(...data.map((d) => d.label.length));
  const axisWidth = Math.min(120, Math.max(56, longestLabel * 7));
  const height = Math.max(120, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--chart-gridline)" horizontal={false} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={axisWidth}
          tick={{ fill: "var(--chart-ink-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--chart-gridline)", opacity: 0.4 }}
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              label={payload?.[0]?.payload?.label}
              value={payload?.[0]?.value as number | undefined}
              valueSuffix={valueSuffix}
            />
          )}
        />
        <Bar dataKey="value" fill="var(--chart-series)" radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList
            dataKey="value"
            position="right"
            fill="var(--chart-ink-secondary)"
            fontSize={12}
            formatter={(v: React.ReactNode) => Number(v).toLocaleString()}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
