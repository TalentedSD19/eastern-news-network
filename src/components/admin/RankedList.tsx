import { cn } from "@/lib/utils";

interface Props {
  data: { label: string; value: number; sublabel?: string }[];
  /** Show each row's share of the list total. Off for truncated lists (e.g. top 10 countries). */
  showShare?: boolean;
  /** Rows shown before the rest are folded into "N more". */
  limit?: number;
  valueSuffix?: string;
  emptyMessage?: string;
}

// Label / bar / number rows — easier to scan than an axis chart for "which source is biggest".
export default function RankedList({
  data,
  showShare = true,
  limit = 8,
  valueSuffix = "views",
  emptyMessage = "Nothing recorded for this period yet.",
}: Props) {
  const rows = data.filter((d) => d.value > 0);
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>;
  }

  const total = rows.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value));
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit);
  const restTotal = rest.reduce((sum, d) => sum + d.value, 0);

  return (
    <ol className="space-y-3">
      {shown.map((d, i) => {
        const share = total > 0 ? (d.value / total) * 100 : 0;
        return (
          <li key={`${d.label}-${i}`} title={`${d.label}: ${d.value.toLocaleString()} ${valueSuffix}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="min-w-0 truncate text-gray-800 dark:text-gray-100">
                {d.label}
                {d.sublabel && <span className="text-gray-400 dark:text-gray-500"> · {d.sublabel}</span>}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-gray-900 dark:text-gray-50">{d.value.toLocaleString()}</span>
                {showShare && (
                  <span className="ml-1.5 inline-block w-9 text-right text-xs text-gray-400 dark:text-gray-500">
                    {share < 1 ? "<1" : Math.round(share)}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={cn("h-full rounded-full", i === 0 ? "bg-brand-accent" : "bg-brand-accent/50")}
                style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
      {rest.length > 0 && (
        <li className="pt-1 text-xs text-gray-500 dark:text-gray-400">
          + {rest.length} more ({restTotal.toLocaleString()} {valueSuffix})
        </li>
      )}
    </ol>
  );
}
