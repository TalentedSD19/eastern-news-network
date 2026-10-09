import Link from "next/link";

interface Props {
  items: { id: string; title: string; byline: string; value: string; detail?: string }[];
  emptyMessage: string;
}

// Short ranked list of articles with one headline number each; rows open the article's metrics.
export default function ArticleScoreList({ items, emptyMessage }: Props) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ol className="-mx-2">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
          <span className="w-4 shrink-0 text-right text-sm tabular-nums text-gray-300 dark:text-gray-600">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/articles/${item.id}/metrics`}
              title={item.title}
              className="block text-sm font-medium truncate hover:text-brand-accent transition-colors after:absolute after:inset-0"
            >
              {item.title}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.byline}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display font-medium tabular-nums leading-tight">{item.value}</p>
            {item.detail && <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
