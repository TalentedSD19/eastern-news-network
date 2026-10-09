import { HelpCircle, Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Mobile: Smartphone, Tablet, Desktop: Monitor };
// Same brand hue at falling strength, so the biggest slice reads first.
const SHADES = ["opacity-100", "opacity-60", "opacity-35", "opacity-20"];

// One stacked bar + legend: "how many read on a phone?" at a glance.
export default function DeviceSplit({ data }: { data: { label: string; value: number }[] }) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nothing recorded for this period yet.</p>;
  }

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5" aria-hidden>
        {rows.map((d, i) => (
          <div
            key={d.label}
            className={`bg-brand-accent ${SHADES[Math.min(i, SHADES.length - 1)]}`}
            style={{ width: `${(d.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((d, i) => {
          const Icon = ICONS[d.label] ?? HelpCircle;
          return (
            <li key={d.label} className="flex items-center gap-2.5">
              <span className="relative flex items-center justify-center size-8 rounded-md bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                <Icon className="size-4" />
                <span
                  className={`absolute -top-0.5 -right-0.5 size-2 rounded-full bg-brand-accent ${SHADES[Math.min(i, SHADES.length - 1)]}`}
                />
              </span>
              <span>
                <span className="block text-lg font-display font-medium tabular-nums leading-tight">
                  {Math.round((d.value / total) * 100)}%
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {d.label} · {d.value.toLocaleString()}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
