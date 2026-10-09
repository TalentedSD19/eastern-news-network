"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartTooltip from "./ChartTooltip";

interface Props {
  /** `label` is the axis tick; `tooltipLabel` (if set) is the longer text shown on hover. */
  data: { label: string; value: number; tooltipLabel?: string }[];
  /** Index of the bar drawn at full strength; the others are muted. */
  highlightIndex?: number;
  /** Show every Nth tick label (0 = all). */
  tickInterval?: number;
  height?: number;
  valueSuffix?: string;
}

// Vertical bars for ordered buckets (hours of the day, days since publish).
export default function ColumnChart({ data, highlightIndex, tickInterval = 0, height = 200, valueSuffix = "views" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--chart-gridline)" vertical={false} />
        <XAxis
          dataKey="label"
          interval={tickInterval}
          tick={{ fill: "var(--chart-ink-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--chart-axis)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--chart-ink-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ fill: "var(--chart-gridline)", opacity: 0.4 }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as Props["data"][number] | undefined;
            return (
              <ChartTooltip
                active={active}
                label={point?.tooltipLabel ?? point?.label}
                value={point?.value}
                valueSuffix={valueSuffix}
              />
            );
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill="var(--chart-series)"
              fillOpacity={highlightIndex === undefined || i === highlightIndex ? 1 : 0.4}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
