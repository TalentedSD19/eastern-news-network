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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[0.65rem] font-bold text-gray-500 dark:text-gray-400 shrink-0 overflow-hidden">
              {hero.authorImage ? (
                <Image src={hero.authorImage} alt={byline} width={28} height={28} className="w-full h-full object-cover" />
              ) : (
                byline.charAt(0).toUpperCase()
              )}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{byline}</p>
              <p className="text-[0.65rem] text-gray-400 dark:text-gray-500">Author</p>
            </div>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[2.25rem] leading-[1.1] text-gray-900 dark:text-gray-50 mb-3 group-hover:text-brand-accent transition-colors duration-150">
            {hero.title}
          </h1>
          <div className="flex items-center gap-2 text-[0.7rem] mb-4">
            {hero.isBreaking && (
              <span className="bg-brand-accent text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-[0.12em] uppercase">
                Breaking
              </span>
            )}
            <span className="font-bold tracking-wide uppercase text-brand-accent">{hero.category.name}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-400 dark:text-gray-500">{heroMins} minute read</span>
          </div>
          <div className="relative aspect-[16/7.7] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
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
          </div>
        </Link>
      </div>

      {/* ── Side list ── */}
      <div className="lg:col-span-1 flex flex-col divide-y divide-gray-100 dark:divide-white/10">
        {sideList.map((article) => {
          const mins = readingTime(article.body);
          return (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="group flex items-start justify-between gap-4 py-4 first:pt-0"
            >
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[0.95rem] leading-snug text-gray-900 dark:text-gray-50 line-clamp-2 mb-1.5 group-hover:text-brand-accent transition-colors duration-150">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1.5 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-wide uppercase">
                  <span className="text-brand-accent">{article.category.name}</span>
                  <span className="text-gray-300 dark:text-gray-600 normal-case">·</span>
                  <span className="text-gray-400 dark:text-gray-500 normal-case font-semibold tracking-normal">{mins} min read</span>
                </div>
              </div>
              <div className="relative w-20 h-16 sm:w-24 sm:h-20 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
                {article.coverImage ? (
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="100px"
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
