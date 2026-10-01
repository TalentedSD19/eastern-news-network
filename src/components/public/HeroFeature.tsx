import Link from "next/link";
import Image from "next/image";
import { ArticleWithRelations } from "@/types";
import { readingTime } from "@/lib/utils";

export default function HeroFeature({
  hero,
  sideList,
}: {
  hero: ArticleWithRelations;
  sideList: ArticleWithRelations[];
}) {
  const byline = hero.reporterName ?? hero.author.name;
  const heroMins = readingTime(hero.body);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
      {/* ── Lead story ── */}
      <div className="lg:col-span-2">
        <Link href={`/article/${hero.slug}`} className="group block">
          <h1 className="font-display font-medium tracking-tight text-[1.75rem] sm:text-[2.125rem] lg:text-[2.5rem] leading-[1.15] text-gray-900 dark:text-gray-50 mb-4 group-hover:text-brand-accent transition-colors duration-150">
            {hero.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] mb-5">
            {hero.isBreaking && (
              <span className="bg-brand-accent text-white text-[10px] font-semibold px-2 py-1 rounded-sm tracking-[0.08em] uppercase">
                Breaking
              </span>
            )}
            <span className="text-brand-accent">{hero.category.name}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-400 dark:text-gray-500">{heroMins} minute read</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[0.6rem] font-bold text-gray-500 dark:text-gray-400 shrink-0 overflow-hidden">
                {hero.authorImage ? (
                  <Image src={hero.authorImage} alt={byline} width={24} height={24} className="w-full h-full object-cover" />
                ) : (
                  byline.charAt(0).toUpperCase()
                )}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{byline}</span>
            </span>
          </div>
          <div className="relative aspect-[16/8.25] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
            {hero.coverImage ? (
              <Image
                src={hero.coverImage}
                alt={hero.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-300 dark:text-gray-600 text-xs tracking-widest uppercase">No image</span>
              </div>
            )}
            {/* Excerpt revealed on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pb-5 pt-16 sm:px-6 sm:pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm sm:text-base leading-relaxed text-white/95 line-clamp-3 max-w-3xl">{hero.excerpt}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Side list ── */}
      <div className="lg:col-span-1 flex flex-col lg:justify-between">
        {sideList.map((article) => {
          const mins = readingTime(article.body);
          const sideByline = article.reporterName ?? article.author.name;
          return (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className={
                // Light divider above every item but the first, spanning the item edge to edge
                "group relative flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 " +
                "[&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:inset-x-0 " +
                "[&:not(:first-child)]:before:h-px " +
                "[&:not(:first-child)]:before:bg-gray-200 dark:[&:not(:first-child)]:before:bg-white/10 [&:not(:first-child)]:before:content-['']"
              }
            >
              <div className="min-w-0">
                <h3 className="font-display font-medium tracking-tight text-base sm:text-[1.0625rem] leading-snug text-gray-900 dark:text-gray-50 mb-1.5 group-hover:text-brand-accent transition-colors duration-150">
                  {article.title}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 lg:line-clamp-1 xl:line-clamp-2 mb-1.5 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-accent">{article.category.name}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">{mins} min read</span>
                </div>
                {/* Own line: next to the larger thumbnail there's no room for
                    category, read time and byline on one row. */}
                <div className="flex items-center gap-1.5 text-xs mt-1 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[0.55rem] font-bold text-gray-500 dark:text-gray-400 shrink-0 overflow-hidden">
                    {article.authorImage ? (
                      <Image src={article.authorImage} alt={sideByline} width={16} height={16} className="w-full h-full object-cover" />
                    ) : (
                      sideByline.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 truncate" title={sideByline}>{sideByline}</span>
                </div>
              </div>
              <div className="relative w-32 h-24 sm:w-48 sm:h-40 lg:w-28 lg:h-24 xl:w-48 xl:h-40 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
                {article.coverImage ? (
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 128px, (max-width: 1280px) 192px, 192px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
