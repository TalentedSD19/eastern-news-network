import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleGrid from "@/components/public/ArticleGrid";
import Pagination from "@/components/public/Pagination";
import { slugify } from "@/lib/utils";
import type { ArticleWithRelations } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const SITE_URL = "https://easternnewsnetwork.com";

async function resolveByline(slug: string): Promise<string | null> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { reporterName: true, author: { select: { name: true } } },
  });
  const bylines = new Set(rows.map((r) => r.reporterName ?? r.author.name));
  return Array.from(bylines).find((name) => slugify(name) === slug) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const byline = await resolveByline(params.slug);
  if (!byline) return {};

  const url = `${SITE_URL}/author/${params.slug}`;
  return {
    title: byline,
    description: `Articles by ${byline} on Eastern News Network.`,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: byline,
      description: `Articles by ${byline} on Eastern News Network.`,
    },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const byline = await resolveByline(params.slug);
  if (!byline) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    status: "PUBLISHED" as const,
    OR: [{ reporterName: byline }, { reporterName: null, author: { name: byline } }],
  };

  const [articles, total, profile] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.article.count({ where }),
    prisma.article.findFirst({
      where: { ...where, aboutAuthors: { not: null } },
      select: { aboutAuthors: true, authorImage: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const bio = profile?.aboutAuthors ?? null;
  const image = profile?.authorImage ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: byline,
    url: `${SITE_URL}/author/${params.slug}`,
    ...(bio ? { description: bio } : {}),
    ...(image ? { image } : {}),
    worksFor: {
      "@type": "NewsMediaOrganization",
      name: "Eastern News Network",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-5 mb-8">
            {image && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                <Image src={image} alt={byline} fill className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">
                Author
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950">{byline}</h1>
              <div className="w-8 h-0.5 bg-brand-red mt-3" />
            </div>
          </div>

          {bio && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mb-10 whitespace-pre-line">
              {bio}
            </p>
          )}

          <ArticleGrid articles={articles as ArticleWithRelations[]} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} basePath={`/author/${params.slug}`} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
