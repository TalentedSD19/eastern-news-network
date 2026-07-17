import Link from "next/link";
import Image from "next/image";
import { ArticleWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ArticleCard({ article, priority = false }: { article: ArticleWithRelations; priority?: boolean }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group block bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-md dark:hover:shadow-black/40 transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-white/5">
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
      <div className="p-4 border-t border-gray-100 dark:border-white/10">
        <span className="inline-block text-[0.65rem] font-semibold tracking-widest uppercase text-brand-red mb-2">
          {article.category.name}
        </span>
        <h2 className="font-serif font-bold text-[1.05rem] leading-snug mb-2 line-clamp-2 text-gray-900 dark:text-gray-50 group-hover:text-brand-red transition-colors duration-150">
          {article.title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3 leading-relaxed font-sans">
          {article.excerpt}
        </p>
        <div className="text-[0.7rem] text-gray-400 dark:text-gray-500 font-sans tracking-wide uppercase">
          {article.reporterName ?? article.author.name}
          <span className="mx-1.5">·</span>
          {formatDate(article.publishedAt ?? article.createdAt)}
        </div>
      </div>
    </Link>
  );
}
