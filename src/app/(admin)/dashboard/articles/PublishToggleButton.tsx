"use client";

import { useState } from "react";
import { doneProgress, startProgress, useProgressRouter } from "@/lib/navigationProgress";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  currentStatus: "DRAFT" | "PUBLISHED";
}

export default function PublishToggleButton({ id, currentStatus }: Props) {
  const router = useProgressRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    startProgress();
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null);
    setLoading(false);
    if (!res?.ok) {
      doneProgress();
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Couldn't update the article.");
      return;
    }
    router.refresh();
  }

  const isPublished = currentStatus === "PUBLISHED";

  return (
    <span className="relative inline-flex">
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={handleToggle}
        className={
          isPublished
            ? "border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            : "border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
        }
      >
        {loading ? "…" : isPublished ? "Unpublish" : "Publish"}
      </Button>
      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full mt-1 z-10 w-56 rounded-md bg-red-600 px-2 py-1 text-left text-[11px] text-white shadow-lg"
        >
          {error}
        </span>
      )}
    </span>
  );
}
