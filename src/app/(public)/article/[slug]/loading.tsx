import { HeaderSkeleton, FooterSkeleton } from "@/components/public/LoadingSkeletons";

export default function ArticleLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="flex-1 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 animate-pulse">
          {/* Category */}
          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-20 mb-5" />

          {/* Headline */}
          <div className="space-y-3 mb-4">
            <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-full" />
            <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
          </div>

          {/* Subtitle */}
          <div className="space-y-2 mb-6">
            <div className="h-5 bg-gray-100 dark:bg-white/5 rounded w-full" />
            <div className="h-5 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
          </div>

          {/* Red rule */}
          <div className="w-10 h-0.5 bg-brand-red mb-5" />

          {/* Byline row */}
          <div className="flex justify-between mb-8 gap-4">
            <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-40" />
            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-28" />
          </div>

          {/* Cover image */}
          <div className="aspect-[16/9] bg-gray-200 dark:bg-white/10 rounded-sm mb-10" />

          {/* Body lines */}
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`h-4 bg-gray-100 dark:bg-white/5 rounded ${i % 5 === 4 ? "w-2/3" : i % 7 === 6 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>
        </div>
      </main>
      <FooterSkeleton />
    </>
  );
}
