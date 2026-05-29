import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleGrid from "@/components/public/ArticleGrid";
import Pagination from "@/components/public/Pagination";
import type { ArticleWithRelations } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <ArticleGrid articles={articles as ArticleWithRelations[]} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} basePath="/" />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
