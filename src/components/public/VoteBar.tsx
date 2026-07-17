"use client";

import { useEffect, useState } from "react";

interface Props {
  articleId: string;
  initialUp: number;
  initialDown: number;
}

function getOrCreateToken(): string {
  const key = "enn_voter_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

export default function VoteBar({ articleId, initialUp, initialDown }: Props) {
  const [counts, setCounts] = useState({ up: initialUp, down: initialDown });
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getOrCreateToken();
    fetch(`/api/articles/${articleId}/votes?voterToken=${token}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts({ up: data.up, down: data.down });
        setUserVote(data.userVote);
      });
  }, [articleId]);

  async function vote(type: "UP" | "DOWN") {
    if (loading) return;
    setLoading(true);
    const token = getOrCreateToken();
    const res = await fetch(`/api/articles/${articleId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterToken: token, voteType: type }),
    });
    const data = await res.json();
    setCounts({ up: data.up, down: data.down });
    setUserVote(data.userVote);
    setLoading(false);
  }

  const total = counts.up + counts.down;
  const upPct = total > 0 ? Math.round((counts.up / total) * 100) : 50;
  const downPct = total > 0 ? 100 - upPct : 50;

  return (
    <section className="my-12 border-t border-b border-gray-200 dark:border-white/10 py-10">
      <div className="text-center mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-2">
          Reader Verdict
        </p>
        <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-50">
          How do you rate this report?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          Your vote helps us understand what journalism matters to our readers.
        </p>
      </div>

      <div className="flex gap-4 sm:gap-6 justify-center max-w-lg mx-auto">
        {/* Upvote */}
        <button
          onClick={() => vote("UP")}
          disabled={loading}
          aria-pressed={userVote === "UP"}
          className={`group flex-1 flex flex-col items-center gap-3 rounded-lg border-2 px-4 py-6 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            userVote === "UP"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:ring-emerald-400"
          } disabled:cursor-not-allowed`}
        >
          <ThumbUpIcon
            className={`w-8 h-8 transition-colors ${
              userVote === "UP" ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-gray-400 group-hover:stroke-emerald-500"
            }`}
          />
          <div className="text-center">
            <p className={`text-sm font-bold ${userVote === "UP" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-gray-200"}`}>
              Credible Report
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">Accurate &amp; well-sourced</p>
          </div>
          <span
            className={`text-2xl font-black tabular-nums ${
              userVote === "UP" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {counts.up}
          </span>
          {userVote === "UP" && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
              Your vote
            </span>
          )}
        </button>

        {/* Downvote */}
        <button
          onClick={() => vote("DOWN")}
          disabled={loading}
          aria-pressed={userVote === "DOWN"}
          className={`group flex-1 flex flex-col items-center gap-3 rounded-lg border-2 px-4 py-6 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            userVote === "DOWN"
              ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 focus-visible:ring-rose-500"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-400 focus-visible:ring-rose-400"
          } disabled:cursor-not-allowed`}
        >
          <ThumbDownIcon
            className={`w-8 h-8 transition-colors ${
              userVote === "DOWN" ? "stroke-rose-600 dark:stroke-rose-400" : "stroke-gray-400 group-hover:stroke-rose-500"
            }`}
          />
          <div className="text-center">
            <p className={`text-sm font-bold ${userVote === "DOWN" ? "text-rose-700 dark:text-rose-400" : "text-gray-800 dark:text-gray-200"}`}>
              Needs Scrutiny
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">Questionable or inaccurate</p>
          </div>
          <span
            className={`text-2xl font-black tabular-nums ${
              userVote === "DOWN" ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {counts.down}
          </span>
          {userVote === "DOWN" && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-rose-600 dark:text-rose-400">
              Your vote
            </span>
          )}
        </button>
      </div>

      {/* Credibility bar */}
      {total > 0 && (
        <div className="mt-8 max-w-sm mx-auto">
          <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100 dark:bg-white/10">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${upPct}%` }}
            />
            <div
              className="h-full bg-rose-400 transition-all duration-500"
              style={{ width: `${downPct}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500 mt-2">
            <span>{upPct}% found this credible</span>
            <span>{total} {total === 1 ? "reader" : "readers"} voted</span>
            <span>{downPct}% flagged it</span>
          </div>
        </div>
      )}
    </section>
  );
}
