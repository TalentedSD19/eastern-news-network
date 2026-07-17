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
import { formatDateTimeIST, slugify } from "@/lib/utils";
import { extractTweetId } from "@/lib/extractTweetId";

export const dynamic = "force-dynamic";

function readingTime(html: string): number {
  const wordCount = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

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

const SITE_URL = "https://easternnewsnetwork.com";

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
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  if (!article) return {};

  const url = `${SITE_URL}/article/${params.slug}`;
  const images = article.coverImage
    ? [{ url: article.coverImage, alt: article.title }]
    : [];

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.seoKeywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.excerpt,
      images,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.author.name],
      section: article.category.name,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [article.coverImage] : [],
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

  const tweetId = article.twitterUrl ? extractTweetId(article.twitterUrl) : null;
  const byline = article.reporterName ?? article.author.name;
  const isBreaking = article.isBreaking;
  const subtitle = article.subtitle;
  const dateline = article.dateline;
  const aboutAuthors = article.aboutAuthors;
  const authorImage = article.authorImage;
  const mins = readingTime(article.body);
  const multipleAuthors = aboutAuthors?.includes("\n\n") ?? false;

  const articleUrl = `${SITE_URL}/article/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    url: articleUrl,
    datePublished: (article.publishedAt ?? article.createdAt).toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: byline,
      url: `${SITE_URL}/author/${slugify(byline)}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Eastern News Network",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/android-chrome-512x512.png`,
      },
    },
    image: article.coverImage
      ? { "@type": "ImageObject", url: article.coverImage }
      : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <ViewTracker articleId={article.id} />

      <main className="flex-1 bg-white">

        {/* ── Article header ── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">

          {/* Category + Breaking */}
          <div className="flex items-center gap-3 mb-5">
            {isBreaking && (
              <span className="bg-brand-red text-white text-[10px] font-black px-2.5 py-1 rounded-sm tracking-[0.15em] uppercase animate-pulse">
                Breaking
              </span>
            )}
            <Link
              href={`/category/${article.category.slug}`}
              className="text-brand-red text-[11px] font-black uppercase tracking-[0.15em] hover:underline underline-offset-2"
            >
              {article.category.name}
            </Link>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] text-gray-950 mb-4">
            {article.title}
          </h1>

          {/* Deck / subtitle */}
          {subtitle && (
            <p className="font-serif text-xl text-gray-500 leading-relaxed mb-6">
              {subtitle}
            </p>
          )}

          {/* Thin rule */}
          <div className="w-10 h-0.5 bg-brand-red mb-5" />

          {/* Byline + meta */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[13px] text-gray-500 mb-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>
                <UserIcon />
                <Link
                  href={`/author/${slugify(byline)}`}
                  className="font-semibold text-gray-800 hover:text-brand-red transition-colors"
                >
                  By {byline}
                </Link>
              </span>
              {dateline && (
                <>
                  <span className="text-gray-300 select-none">·</span>
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-gray-500">
                    {dateline}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <span>
                <CalendarIcon />
                {formatDateTimeIST(article.publishedAt ?? article.createdAt)}
              </span>
              <span className="text-gray-200 select-none">·</span>
              <span>
                <ClockIcon />
                {mins} min read
              </span>
            </div>
          </div>
        </div>

        {/* ── Cover image ── */}
        {article.coverImage && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
            <figure className="relative w-full aspect-[16/9] rounded-sm overflow-hidden bg-gray-100">
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
            <Suspense fallback={<div className="h-32 my-6 bg-gray-100 animate-pulse rounded-lg" />}>
              <TweetEmbed tweetId={tweetId} />
            </Suspense>
          )}

          {/* About the Author(s) */}
          {aboutAuthors && (
            <div className="mt-12 mb-8 border-t-2 border-brand-red pt-8">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-6 text-center">
                About the {multipleAuthors ? "Authors" : "Author"}
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm flex-shrink-0">
                  <Image
                    src={authorImage ?? "/prasanta_profile_image.jpg"}
                    alt={byline}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed text-justify max-w-xl">
                  {aboutAuthors}
                </p>
              </div>
            </div>
          )}

          {/* ── Share ── */}
          <ShareBar title={article.title} />

          {/* ── Vote section — prominently at bottom ── */}
          <VoteBar articleId={article.id} initialUp={initialUp} initialDown={initialDown} />

          {/* ── Comments ── */}
          <CommentSection articleId={article.id} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
