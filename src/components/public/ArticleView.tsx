import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import ArticleBody from "./ArticleBody";
import ArticleCard from "./ArticleCard";
import { formatDateTimeIST, readingTime, slugify } from "@/lib/utils";
import type { ArticleWithRelations } from "@/types";

// The article page's <main>, shared by the public article route and the
// editor's preview tab so the two can't drift apart. Interactive pieces
// (votes, share, tweet, comments) come in as slots so each side can wire
// them to live data or to an inert preview.

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

interface Props {
  title: ReactNode;
  coverAlt: string;
  subtitle: string | null;
  dateline: string | null;
  isBreaking: boolean;
  category: { name: string; slug: string } | null;
  byline: string;
  date: Date;
  body: string;
  coverImage: string | null;
  aboutAuthors: string | null;
  authorImage: string | null;
  similarArticles: ArticleWithRelations[];
  voteBar: ReactNode;
  shareBar: ReactNode;
  tweet: ReactNode;
  comments: ReactNode;
}

export default function ArticleView({
  title,
  coverAlt,
  subtitle,
  dateline,
  isBreaking,
  category,
  byline,
  date,
  body,
  coverImage,
  aboutAuthors,
  authorImage,
  similarArticles,
  voteBar,
  shareBar,
  tweet,
  comments,
}: Props) {
  const mins = readingTime(body);
  const multipleAuthors = aboutAuthors?.includes("\n\n") ?? false;

  return (
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
          {category && (
            <Link
              href={`/category/${category.slug}`}
              className="text-brand-accent text-sm hover:underline underline-offset-2"
            >
              {category.name}
            </Link>
          )}
        </div>

        {/* Headline */}
        <h1 className="font-display font-medium tracking-tight text-[2rem] sm:text-4xl lg:text-[2.75rem] leading-[1.15] text-gray-950 dark:text-gray-50 mb-4">
          {title}
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
              {formatDateTimeIST(date)}
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
          {voteBar}
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />
          {shareBar}
        </div>
      </div>

      {/* ── Cover image ── */}
      {coverImage && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
          <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
            <Image
              src={coverImage}
              alt={coverAlt}
              fill
              priority
              className="object-cover"
            />
          </figure>
        </div>
      )}

      {/* ── Article body + end matter ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">

        <ArticleBody html={body} />

        {tweet}

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
        {comments}
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
              {similarArticles.map((a) => (
                <div key={a.id} className="w-full sm:w-[calc(50%-0.75rem)] xl:w-[calc(25%-1.125rem)]">
                  <ArticleCard article={a} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
