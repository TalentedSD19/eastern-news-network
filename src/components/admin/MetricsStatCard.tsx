interface Props {
  label: string;
  value: number | string;
  delta?: { pct: number; periodLabel: string };
}

export default function MetricsStatCard({ label, value, delta }: Props) {
  const showDelta = delta && Number.isFinite(delta.pct);
  const isUp = showDelta && delta.pct >= 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold font-serif">{value}</p>
      {showDelta && (
        <p className={`text-xs mt-1.5 font-medium ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(delta.pct).toFixed(0)}% vs {delta.periodLabel}
        </p>
      )}
    </div>
  );
}
