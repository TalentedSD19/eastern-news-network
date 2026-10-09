import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import ArticleView from "@/components/public/ArticleView";
import ViewTracker from "@/components/public/ViewTracker";
import VoteBar from "@/components/public/VoteBar";
import ShareBar from "@/components/public/ShareBar";
import CommentSection from "@/components/public/CommentSection";
import TweetEmbed from "@/components/public/TweetEmbed";
import { slugify } from "@/lib/utils";
import { extractTweetId } from "@/lib/extractTweetId";
import type { ArticleWithRelations } from "@/types";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, baseOpenGraph, jsonLdScript } from "@/lib/seo";
import { fillAuthorImages } from "@/lib/authorImages";
import { getSimilarArticles } from "@/lib/similarArticles";

export const dynamic = "force-dynamic";

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

  const similarArticles = await getSimilarArticles({
    id: article.id,
    categoryId: article.categoryId,
    title: article.title,
  });

  // One lookup fills missing author photos for this article and the cards below.
  const [withImage, ...similarWithImages] = await fillAuthorImages([article, ...similarArticles]);

  const tweetId = article.twitterUrl ? extractTweetId(article.twitterUrl) : null;
  const byline = article.reporterName ?? article.author.name;

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

      <ArticleView
        title={article.title}
        coverAlt={article.title}
        subtitle={article.subtitle}
        dateline={article.dateline}
        isBreaking={article.isBreaking}
        category={article.category}
        byline={byline}
        date={article.publishedAt ?? article.createdAt}
        body={article.body}
        coverImage={article.coverImage}
        aboutAuthors={article.aboutAuthors}
        authorImage={withImage.authorImage}
        similarArticles={similarWithImages as ArticleWithRelations[]}
        voteBar={<VoteBar articleId={article.id} initialUp={initialUp} initialDown={initialDown} compact />}
        shareBar={<ShareBar title={article.title} articleId={article.id} compact />}
        tweet={
          tweetId && (
            <Suspense fallback={<div className="h-32 my-6 bg-gray-100 dark:bg-white/5 animate-pulse rounded-lg" />}>
              <TweetEmbed tweetId={tweetId} />
            </Suspense>
          )
        }
        comments={<CommentSection articleId={article.id} />}
      />

      <SiteFooter />
    </>
  );
}
