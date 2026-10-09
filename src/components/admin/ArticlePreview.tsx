"use client";

import { useEffect, useState, type ReactNode } from "react";
import ArticleView from "@/components/public/ArticleView";
import VoteBar from "@/components/public/VoteBar";
import ShareBar from "@/components/public/ShareBar";
import CommentSection from "@/components/public/CommentSection";
import TweetRenderer from "@/components/public/TweetRenderer";
import { extractTweetId } from "@/lib/extractTweetId";
import type { Tweet } from "react-tweet/api";
import type { ArticleWithRelations } from "@/types";

interface Props {
  articleId: string | null;
  slug: string;
  title: string;
  subtitle: string;
  dateline: string;
  isBreaking: boolean;
  category: { id: string; name: string; slug: string } | undefined;
  byline: string;
  date: Date;
  body: string;
  coverImage: string | null;
  twitterUrl: string;
  aboutAuthors: string;
  authorImage: string;
  siteHeader: ReactNode;
  siteFooter: ReactNode;
}

function PreviewTweet({ tweetId }: { tweetId: string }) {
  const [tweet, setTweet] = useState<Tweet | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setTweet(undefined);
    fetch(`/api/preview/tweet/${tweetId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setTweet(data))
      .catch(() => !cancelled && setTweet(null));
    return () => {
      cancelled = true;
    };
  }, [tweetId]);

  if (tweet === undefined) {
    return <div className="h-32 my-6 bg-gray-100 dark:bg-white/5 animate-pulse rounded-lg" />;
  }
  if (!tweet) return null;
  return (
    <div className="flex justify-center my-6">
      <TweetRenderer tweet={tweet} />
    </div>
  );
}

// The full public article page (header, article, footer) built from the
// editor's unsaved state. Buttons and forms render exactly as on the live
// page, but every link and button is disabled.
export default function ArticlePreview({
  articleId,
  slug,
  title,
  subtitle,
  dateline,
  isBreaking,
  category,
  byline,
  date,
  body,
  coverImage,
  twitterUrl,
  aboutAuthors,
  authorImage,
  siteHeader,
  siteFooter,
}: Props) {
  const [similar, setSimilar] = useState<ArticleWithRelations[]>([]);
  const [origin, setOrigin] = useState("");
  const categoryId = category?.id ?? "";
  const tweetId = twitterUrl ? extractTweetId(twitterUrl) : null;

  useEffect(() => setOrigin(window.location.origin), []);

  // Debounced so typing in the title doesn't fire a query per keystroke.
  useEffect(() => {
    if (!categoryId) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ categoryId, title, id: articleId ?? "" });
      fetch(`/api/preview/similar?${params}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => !cancelled && setSimilar(data))
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [categoryId, title, articleId]);

  // Every link and button keeps its live look but does nothing here: the
  // event is stopped before it reaches the component's own handler.
  function blockInteraction(e: React.SyntheticEvent) {
    if (e.type === "submit" || (e.target as Element).closest("a, button")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div
      onClickCapture={blockInteraction}
      onSubmitCapture={blockInteraction}
      className="[&_a]:cursor-not-allowed [&_button]:cursor-not-allowed flex flex-col rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-background text-gray-900 dark:text-gray-100"
    >
      {siteHeader}
      <ArticleView
        title={title || <span className="text-gray-300 dark:text-gray-600">Article title will appear here</span>}
        coverAlt={title}
        subtitle={subtitle || null}
        dateline={dateline || null}
        isBreaking={isBreaking}
        category={category ?? null}
        byline={byline}
        date={date}
        body={body}
        coverImage={coverImage}
        aboutAuthors={aboutAuthors || null}
        authorImage={authorImage || null}
        similarArticles={similar}
        voteBar={<VoteBar articleId={articleId ?? ""} initialUp={0} initialDown={0} compact preview />}
        shareBar={
          <ShareBar
            title={title}
            articleId={articleId ?? ""}
            compact
            preview
            url={origin ? `${origin}/article/${slug}` : undefined}
          />
        }
        tweet={tweetId && <PreviewTweet tweetId={tweetId} />}
        comments={<CommentSection articleId={articleId ?? ""} preview />}
      />
      {siteFooter}
    </div>
  );
}
