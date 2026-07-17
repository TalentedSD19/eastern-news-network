import { HeaderSkeleton, SkeletonCard, FooterSkeleton } from "@/components/public/LoadingSkeletons";

export default function CategoryLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
      <FooterSkeleton />
    </>
  );
}
