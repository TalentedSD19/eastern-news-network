import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  /** One plain-language line explaining what the number means. */
  hint?: string;
  delta?: { pct: number; periodLabel: string };
  /** Shown instead of the value when there's nothing to measure yet. */
  empty?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function MetricsStatCard({ label, value, icon: Icon, hint, delta, empty, children, className }: Props) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm p-5 flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        {Icon && (
          <span className="flex items-center justify-center size-7 rounded-md bg-brand-accent/10 text-brand-accent shrink-0">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      {empty ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">{empty}</p>
      ) : (
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-3xl font-display font-medium tracking-tight tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {delta && <DeltaBadge {...delta} />}
        </div>
      )}
      {children && !empty && <div className="mt-3">{children}</div>}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto pt-3 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function DeltaBadge({ pct, periodLabel }: { pct: number; periodLabel: string }) {
  if (!Number.isFinite(pct)) return null;
  const isUp = pct >= 0;
  return (
    <span
      title={`${isUp ? "Up" : "Down"} ${Math.abs(pct).toFixed(0)}% vs ${periodLabel}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isUp
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
      )}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

/** Thin horizontal meter for percentages (scroll depth, completion…). */
export function MeterBar({ pct, label }: { pct: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden"
    >
      <div className="h-full rounded-full bg-brand-accent" style={{ width: `${clamped}%` }} />
    </div>
  );
}
