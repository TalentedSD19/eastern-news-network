"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types";

export default function CommentSection({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${articleId}/comments`)
      .then((r) => r.json())
      .then(setComments);
  }, [articleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName: name, body }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to post comment");
    } else {
      const newComment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setName("");
      setBody("");
    }
  }

  return (
    <section className="mt-4 border-t border-gray-200 dark:border-white/10 pt-10">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-2">
        Discussion
      </p>
      <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-50 mb-8">
        Reader Comments
        {comments.length > 0 && (
          <span className="ml-2 text-base font-normal text-gray-400 dark:text-gray-500">({comments.length})</span>
        )}
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-10 bg-gray-50 dark:bg-white/5 rounded-sm border border-gray-200 dark:border-white/10 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Leave a comment</p>
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded px-3 py-2">
            {error}
          </p>
        )}
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-sm border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red transition"
        />
        <textarea
          placeholder="Share your thoughts on this article…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          className="w-full rounded-sm border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red transition resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">{body.length}/2000 characters</p>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 sm:py-2 rounded-sm bg-brand-red text-white text-sm font-semibold hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comment list */}
      <div className="space-y-0">
        {comments.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
            No comments yet. Be the first to share your perspective.
          </p>
        )}
        {comments.map((c, i) => (
          <div
            key={c.id}
            className={`py-5 ${i < comments.length - 1 ? "border-b border-gray-100 dark:border-white/10" : ""}`}
          >
            <div className="flex items-baseline gap-2.5 mb-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{c.authorName}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
