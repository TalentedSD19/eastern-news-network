import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleGrid from "@/components/public/ArticleGrid";
import HeroFeature from "@/components/public/HeroFeature";
import FeatureDuo from "@/components/public/FeatureDuo";
import Pagination from "@/components/public/Pagination";
import type { ArticleWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eastern News Network",
  description: "Independent news from the East — politics, economy, society, and culture. Breaking news, analysis, and in-depth coverage.",
  alternates: {
    canonical: "https://easternnewsnetwork.com",
  },
  openGraph: {
    url: "https://easternnewsnetwork.com",
    type: "website",
  },
};

// Front-page layout is hero(1) + side list(4) + duo(2) + grid(8) — the grid count
// is a clean multiple of both the 2-col and 4-col breakpoints so no row is left
// half-empty. Later pages fall back to a plain grid at the same page size.
const PAGE_SIZE = 15;

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
  const typed = articles as ArticleWithRelations[];

  // Page 1 gets the full magazine-style layout; later pages are a plain grid.
  const isFrontPage = page === 1 && typed.length > 0;
  const hero = isFrontPage ? typed[0] : null;
  const sideList = isFrontPage ? typed.slice(1, 5) : [];
  const duo = isFrontPage ? typed.slice(5, 7) : [];
  const rest = isFrontPage ? typed.slice(7) : typed;

  // Spotlight section (mirrors the mockup's category-themed block): whichever
  // category has the most published articles gets its own mini-grid up front.
  let spotlightCategory: { name: string; slug: string } | null = null;
  let spotlightArticles: ArticleWithRelations[] = [];
  if (isFrontPage) {
    const topCategory = await prisma.article.groupBy({
      by: ["categoryId"],
      where: { status: "PUBLISHED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });
    if (topCategory.length > 0) {
      const alreadyShownIds = typed.map((a) => a.id);
      const spotlightArticlesRaw = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: topCategory[0].categoryId,
          id: { notIn: alreadyShownIds },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      });
      spotlightArticles = spotlightArticlesRaw as ArticleWithRelations[];
      if (spotlightArticles.length > 0) {
        spotlightCategory = spotlightArticles[0].category;
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12 sm:space-y-16">
          {hero && (
            <section>
              <HeroFeature hero={hero} sideList={sideList} />
            </section>
          )}

          {duo.length > 0 && (
            <section>
              <FeatureDuo articles={duo} />
            </section>
          )}

          <section>
            {isFrontPage && rest.length > 0 && (
              <div className="flex items-center justify-between mb-7">
                <h2 className="font-display font-extrabold text-2xl text-gray-900 dark:text-gray-50">
                  Latest Articles
                </h2>
                {totalPages > 1 && (
                  <Link
                    href="/?page=2"
                    className="inline-flex items-center gap-1 text-brand-accent text-sm font-bold hover:underline underline-offset-4"
                  >
                    Show More →
                  </Link>
                )}
              </div>
            )}
            <ArticleGrid articles={rest} />
          </section>

          {spotlightCategory && spotlightArticles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-7">
                <h2 className="font-display font-extrabold text-2xl text-gray-900 dark:text-gray-50">
                  {spotlightCategory.name} News
                </h2>
                <Link
                  href={`/category/${spotlightCategory.slug}`}
                  className="inline-flex items-center gap-1 text-brand-accent text-sm font-bold hover:underline underline-offset-4"
                >
                  Show More →
                </Link>
              </div>
              <ArticleGrid articles={spotlightArticles} />
            </section>
          )}

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} basePath="/" />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
