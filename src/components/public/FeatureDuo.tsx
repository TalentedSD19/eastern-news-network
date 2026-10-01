import Link from "next/link";
import Image from "next/image";
import { ArticleWithRelations } from "@/types";
import { readingTime } from "@/lib/utils";

export default function FeatureDuo({ articles }: { articles: ArticleWithRelations[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {articles.map((article) => {
        const byline = article.reporterName ?? article.author.name;
        const mins = readingTime(article.body);
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[13px] mb-2">
                <span className="text-white bg-brand-accent px-1.5 py-0.5 rounded-sm text-xs font-medium">{article.category.name}</span>
                <span className="text-white/40">|</span>
                <span className="text-white/70">{mins} min read</span>
              </div>
              <h3 className="font-display font-medium tracking-tight text-lg sm:text-[1.375rem] leading-snug text-white line-clamp-2 mb-2">
                {article.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-white/85 line-clamp-2 max-h-0 opacity-0 overflow-hidden group-hover:max-h-12 group-hover:opacity-100 group-hover:mb-2 transition-all duration-300">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-1.5 text-[13px] text-white/70">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[0.6rem] font-bold text-white/80 shrink-0 overflow-hidden">
                  {article.authorImage ? (
                    <Image src={article.authorImage} alt={byline} width={20} height={20} className="w-full h-full object-cover" />
                  ) : (
                    byline.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="font-medium">{byline}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
