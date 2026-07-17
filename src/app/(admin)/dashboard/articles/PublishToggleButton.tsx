"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  currentStatus: "DRAFT" | "PUBLISHED";
}

export default function PublishToggleButton({ id, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  const isPublished = currentStatus === "PUBLISHED";

  return (
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
  );
}
