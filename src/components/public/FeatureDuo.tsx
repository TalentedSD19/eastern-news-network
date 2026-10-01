import Link from "next/link";
import Image from "next/image";
import { ArticleWithRelations } from "@/types";

export default function FeatureDuo({ articles }: { articles: ArticleWithRelations[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {articles.map((article) => {
        const byline = article.reporterName ?? article.author.name;
        return (
          <Link
            key={article.id}
            href={`/article/${article.slug}`}
            className="group relative block aspect-[16/11] sm:aspect-[16/10] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5"
          >
            {article.coverImage ? (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[0.7rem] mb-2">
                <span className="font-bold tracking-wide uppercase text-brand-accent">{article.category.name}</span>
              </div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl leading-snug text-white line-clamp-2 mb-2">
                {article.title}
              </h3>
              <p className="text-xs text-white/70">{byline}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
