import { HeaderSkeleton, SkeletonCard, FooterSkeleton } from "@/components/public/LoadingSkeletons";

export default function HomeLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-9">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
      <FooterSkeleton />
    </>
  );
}
