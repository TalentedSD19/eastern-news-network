"use client";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  value?: number;
  valueSuffix?: string;
}

export default function ChartTooltip({ active, label, value, valueSuffix = "views" }: ChartTooltipProps) {
  if (!active || value === undefined) return null;
  return (
    <div className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 shadow-lg text-sm">
      {label && <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{label}</p>}
      <p className="font-semibold text-gray-900 dark:text-gray-50">
        {value.toLocaleString()} <span className="font-normal text-gray-500 dark:text-gray-400">{valueSuffix}</span>
      </p>
    </div>
  );
}
