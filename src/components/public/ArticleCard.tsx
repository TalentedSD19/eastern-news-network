import Link from "next/link";
import Image from "next/image";
import { ArticleWithRelations } from "@/types";
import { readingTime } from "@/lib/utils";

export default function ArticleCard({ article, priority = false }: { article: ArticleWithRelations; priority?: boolean }) {
  const mins = readingTime(article.body);
  const byline = article.reporterName ?? article.author.name;

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <span className="text-gray-300 dark:text-gray-600 text-xs tracking-widest uppercase">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3">
        <div className="flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-gray-500 mb-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[0.6rem] font-bold text-gray-500 dark:text-gray-400 shrink-0 overflow-hidden">
            {article.authorImage ? (
              <Image src={article.authorImage} alt={byline} width={20} height={20} className="w-full h-full object-cover" />
            ) : (
              byline.charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium text-gray-600 dark:text-gray-300">{byline}</span>
        </div>
        <h2 className="font-display font-medium tracking-tight text-[1.0625rem] leading-snug mb-2 line-clamp-2 text-gray-900 dark:text-gray-50 group-hover:text-brand-accent transition-colors duration-150">
          {article.title}
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-brand-accent">{article.category.name}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-400 dark:text-gray-500">{mins} min read</span>
        </div>
      </div>
    </Link>
  );
}
