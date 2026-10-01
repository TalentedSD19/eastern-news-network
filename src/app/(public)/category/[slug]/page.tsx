import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleGrid from "@/components/public/ArticleGrid";
import Pagination from "@/components/public/Pagination";
import type { ArticleWithRelations } from "@/types";
import { DEFAULT_OG_IMAGE, baseOpenGraph } from "@/lib/seo";
import { fillAuthorImages } from "@/lib/authorImages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  // Throwing here (not just in the page) sends a real 404: metadata resolves before
  // the loading.tsx shell streams, after which the status is locked at 200.
  if (!category) notFound();

  const url = `https://easternnewsnetwork.com/category/${params.slug}`;
  return {
    title: category.name,
    description: `Latest news and articles in ${category.name} from Eastern News Network.`,
    alternates: { canonical: url },
    openGraph: {
      ...baseOpenGraph,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
      url,
      title: `${category.name} — Eastern News Network`,
      description: `Latest news and articles in ${category.name} from Eastern News Network.`,
    },
    twitter: {
      card: "summary",
      title: `${category.name} — Eastern News Network`,
      description: `Latest news and articles in ${category.name} from Eastern News Network.`,
    },
  };
}

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
  const articlesWithImages = await fillAuthorImages(articles);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 mb-2">
              Category
            </p>
            <h1 className="font-display font-medium tracking-tight text-3xl sm:text-4xl text-gray-950 dark:text-gray-50">
              {category.name}
            </h1>
            <div className="w-8 h-0.5 bg-brand-accent mt-3" />
          </div>
          <ArticleGrid articles={articlesWithImages as ArticleWithRelations[]} />
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
