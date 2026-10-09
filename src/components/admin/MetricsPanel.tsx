import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  /** Plain-language line under the title saying what the panel answers. */
  subtitle?: string;
  icon?: LucideIcon;
  /** Optional one-sentence takeaway shown under the subtitle, e.g. "Busiest at 8 pm". */
  insight?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function MetricsPanel({ title, subtitle, icon: Icon, insight, action, className, children }: PanelProps) {
  return (
    <section
      className={cn(
        "bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display font-medium tracking-tight text-base">
            {Icon && <Icon className="size-4 text-gray-400 dark:text-gray-500 shrink-0" />}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          {insight && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{insight}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display font-medium tracking-tight text-lg">{title}</h2>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}
