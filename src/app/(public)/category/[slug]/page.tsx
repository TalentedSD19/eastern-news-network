import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleGrid from "@/components/public/ArticleGrid";
import Pagination from "@/components/public/Pagination";
import type { ArticleWithRelations } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", categoryId: category.id },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.article.count({ where: { status: "PUBLISHED", categoryId: category.id } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">
              Category
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950">
              {category.name}
            </h1>
            <div className="w-8 h-0.5 bg-brand-red mt-3" />
          </div>
          <ArticleGrid articles={articles as ArticleWithRelations[]} />
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath={`/category/${params.slug}`}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
