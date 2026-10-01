import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleBody from "@/components/public/ArticleBody";
import ViewTracker from "@/components/public/ViewTracker";
import VoteBar from "@/components/public/VoteBar";
import ShareBar from "@/components/public/ShareBar";
import CommentSection from "@/components/public/CommentSection";
import TweetEmbed from "@/components/public/TweetEmbed";
import ArticleCard from "@/components/public/ArticleCard";
import { formatDateTimeIST, readingTime, slugify } from "@/lib/utils";
import { extractTweetId } from "@/lib/extractTweetId";
import type { ArticleWithRelations } from "@/types";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, baseOpenGraph, jsonLdScript } from "@/lib/seo";
import { fillAuthorImages } from "@/lib/authorImages";

export const dynamic = "force-dynamic";

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-px opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-px opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-px opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      seoKeywords: true,
      publishedAt: true,
      updatedAt: true,
      reporterName: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  // Throwing here (not just in the page) sends a real 404: metadata resolves before
  // the loading.tsx shell streams, after which the status is locked at 200.
  if (!article) notFound();

  const url = `${SITE_URL}/article/${params.slug}`;
  const images = article.coverImage
    ? [{ url: article.coverImage, alt: article.title }]
    : [DEFAULT_OG_IMAGE];
  const byline = article.reporterName ?? article.author.name;

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.seoKeywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      url,
      title: article.title,
      description: article.excerpt,
      images,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [`${SITE_URL}/author/${slugify(byline)}`],
      section: article.category.name,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [images[0].url],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!article) notFound();

  const voteRows = await prisma.vote.groupBy({
    by: ["voteType"],
    where: { articleId: article.id },
    _count: { id: true },
  });
  const initialUp = voteRows.find((r) => r.voteType === "UP")?._count.id ?? 0;
  const initialDown = voteRows.find((r) => r.voteType === "DOWN")?._count.id ?? 0;

  const SIMILAR_LIMIT = 4;
  const similarArticles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: article.categoryId,
      id: { not: article.id },
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SIMILAR_LIMIT,
  });

  if (similarArticles.length < SIMILAR_LIMIT) {
    const keywords = Array.from(
      new Set(
        article.title
          .split(/\W+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 3)
      )
    ).slice(0, 6);

    if (keywords.length > 0) {
      const excludeIds = [article.id, ...similarArticles.map((a) => a.id)];
      const keywordMatches = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: excludeIds },
          OR: keywords.flatMap((word) => [
            { title: { contains: word, mode: "insensitive" as const } },
            { seoKeywords: { contains: word, mode: "insensitive" as const } },
          ]),
        },
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: SIMILAR_LIMIT - similarArticles.length,
      });
      similarArticles.push(...keywordMatches);
    }
  }

  // One lookup fills missing author photos for this article and the cards below.
  const [withImage, ...similarWithImages] = await fillAuthorImages([article, ...similarArticles]);

  const tweetId = article.twitterUrl ? extractTweetId(article.twitterUrl) : null;
  const byline = article.reporterName ?? article.author.name;
  const isBreaking = article.isBreaking;
  const subtitle = article.subtitle;
  const dateline = article.dateline;
  const aboutAuthors = article.aboutAuthors;
  const authorImage = withImage.authorImage;
  const mins = readingTime(article.body);
  const multipleAuthors = aboutAuthors?.includes("\n\n") ?? false;

  const articleUrl = `${SITE_URL}/article/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    url: articleUrl,
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    articleSection: article.category.name,
    keywords: article.seoKeywords ?? undefined,
    wordCount: article.body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    datePublished: (article.publishedAt ?? article.createdAt).toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: byline,
      url: `${SITE_URL}/author/${slugify(byline)}`,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/android-chrome-512x512.png`,
      },
    },
    image: article.coverImage ? [article.coverImage] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: article.category.name, item: `${SITE_URL}/category/${article.category.slug}` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <ViewTracker articleId={article.id} />

      <main className="flex-1 bg-white dark:bg-background">

        {/* ── Article header ── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-2">

          {/* Category + Breaking */}
          <div className="flex items-center gap-3 mb-5">
            {isBreaking && (
              <span className="bg-brand-accent text-white text-[10px] font-semibold px-2.5 py-1 rounded-sm tracking-[0.08em] uppercase animate-pulse">
                Breaking
              </span>
            )}
            <Link
              href={`/category/${article.category.slug}`}
              className="text-brand-accent text-sm hover:underline underline-offset-2"
            >
              {article.category.name}
            </Link>
          </div>

          {/* Headline */}
          <h1 className="font-display font-medium tracking-tight text-[2rem] sm:text-4xl lg:text-[2.75rem] leading-[1.15] text-gray-950 dark:text-gray-50 mb-4">
            {article.title}
          </h1>

          {/* Deck / subtitle */}
          {subtitle && (
            <p className="font-sans text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {subtitle}
            </p>
          )}

          {/* Thin rule */}
          <div className="w-10 h-0.5 bg-brand-accent mb-5" />

          {/* Byline + meta */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[13px] text-gray-500 dark:text-gray-400 mb-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>
                <UserIcon />
                <Link
                  href={`/author/${slugify(byline)}`}
                  className="font-medium text-gray-800 dark:text-gray-200 hover:text-brand-accent transition-colors"
                >
                  By {byline}
                </Link>
              </span>
              {dateline && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 select-none">·</span>
                  <span className="uppercase tracking-wide text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {dateline}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
              <span>
                <CalendarIcon />
                {formatDateTimeIST(article.publishedAt ?? article.createdAt)}
              </span>
              <span className="text-gray-200 dark:text-gray-700 select-none">·</span>
              <span>
                <ClockIcon />
                {mins} min read
              </span>
            </div>
          </div>

          {/* Vote & Share */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-4 mb-2 border-y border-gray-200 dark:border-white/10">
            <VoteBar articleId={article.id} initialUp={initialUp} initialDown={initialDown} compact />
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />
            <ShareBar title={article.title} articleId={article.id} compact />
          </div>
        </div>

        {/* ── Cover image ── */}
        {article.coverImage && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
            <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                className="object-cover"
              />
            </figure>
          </div>
        )}

        {/* ── Article body + end matter ── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">

          <ArticleBody html={article.body} />

          {tweetId && (
            <Suspense fallback={<div className="h-32 my-6 bg-gray-100 dark:bg-white/5 animate-pulse rounded-lg" />}>
              <TweetEmbed tweetId={tweetId} />
            </Suspense>
          )}

          {/* About the Author(s) */}
          {aboutAuthors && (
            <div className="mt-12 mb-8 border-t-2 border-brand-accent pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 mb-6 text-center">
                About the {multipleAuthors ? "Authors" : "Author"}
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-white/10 shadow-sm flex-shrink-0 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  {authorImage ? (
                    <Image src={authorImage} alt={byline} fill className="object-cover" />
                  ) : (
                    <span className="font-display font-medium tracking-tight text-2xl text-gray-400 dark:text-gray-500">
                      {byline.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed text-justify max-w-xl">
                  {aboutAuthors}
                </p>
              </div>
            </div>
          )}

          {/* ── Comments ── */}
          <CommentSection articleId={article.id} />
        </div>

        {/* ── Similar stories ── */}
        {similarArticles.length > 0 && (
          <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-14">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-display font-medium tracking-tight text-2xl sm:text-[2rem] text-gray-900 dark:text-gray-50 whitespace-nowrap">
                  Similar Stories
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-9">
                {(similarWithImages as ArticleWithRelations[]).map((a) => (
                  <div key={a.id} className="w-full sm:w-[calc(50%-0.75rem)] xl:w-[calc(25%-1.125rem)]">
                    <ArticleCard article={a} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
