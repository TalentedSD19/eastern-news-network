"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/core";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ArticleImageManager, { type ArticleImage } from "./ArticleImageManager";
import ArticleBody from "@/components/public/ArticleBody";
import { slugify, formatDateTimeIST } from "@/lib/utils";
import type { ArticleWithRelations } from "@/types";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

type Category = { id: string; name: string; slug: string };

interface Props {
  article?: ArticleWithRelations;
  categories: Category[];
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const EXCERPT_LIMIT = 160;

function initImages(article?: ArticleWithRelations): ArticleImage[] {
  if (!article) return [];
  const stored = article.images as ArticleImage[] | null | undefined;
  if (Array.isArray(stored) && stored.length > 0) return stored;
  if (article.coverImage) return [{ url: article.coverImage, caption: "" }];
  return [];
}

function wordCount(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").filter(Boolean).length : 0;
}

function savedAtLabel(date: Date): string {
  return `Saved at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ArticleForm({ article, categories }: Props) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  // ── Core fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [subtitle, setSubtitle] = useState(article?.subtitle ?? "");
  const [dateline, setDateline] = useState(article?.dateline ?? "");
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [reporterName, setReporterName] = useState(article?.reporterName ?? "");
  const [seoKeywords, setSeoKeywords] = useState(article?.seoKeywords ?? "");
  const [keywordInput, setKeywordInput] = useState("");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [images, setImages] = useState<ArticleImage[]>(() => initImages(article));
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [twitterUrl, setTwitterUrl] = useState(article?.twitterUrl ?? "");
  const [aboutAuthors, setAboutAuthors] = useState(article?.aboutAuthors ?? "");
  const [authorImage, setAuthorImage] = useState(article?.authorImage ?? "/prasanta_profile_image.jpg");
  const [authorImageUploading, setAuthorImageUploading] = useState(false);
  const authorImageRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(article?.status ?? "DRAFT");

  // ── UI state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const words = useMemo(() => wordCount(body), [body]);
  const readingMins = Math.max(1, Math.ceil(words / 200));
  const excerptLen = excerpt.length;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const previewByline = reporterName || "Reporter";

  // Auto-slug for new articles
  useEffect(() => {
    if (!article) setSlug(slugify(title));
  }, [title, article]);

  // ── Auto-save (edit mode only, 5 s debounce) ──────────────────────────────
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!article?.id) return;

    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/articles/${article.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, slug, subtitle, dateline, isBreaking,
            reporterName, excerpt, body,
            coverImage: images[0]?.url ?? null, images,
            categoryId, twitterUrl, seoKeywords, aboutAuthors, authorImage, status,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setLastSaved(new Date());
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, 5000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, subtitle, dateline, isBreaking, reporterName, seoKeywords,
      excerpt, body, images, categoryId, twitterUrl, aboutAuthors, authorImage, status, article?.id]);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaving(true);
    setError("");

    const payload = {
      title, slug, subtitle, dateline, isBreaking,
      reporterName, excerpt, body,
      coverImage: images[0]?.url ?? null, images,
      categoryId, twitterUrl, seoKeywords, aboutAuthors, authorImage, status,
    };

    const url = article ? `/api/articles/${article.id}` : "/api/articles";
    const method = article ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
    } else {
      router.push("/dashboard/articles");
      router.refresh();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 mb-6 border-b dark:border-white/10">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === "edit"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === "preview"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Preview
        </button>

        {/* Auto-save indicator */}
        {article && (
          <span className="ml-auto pb-2 text-xs text-gray-400 dark:text-gray-500">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "unsaved" && "Unsaved changes"}
            {saveStatus === "saved" && lastSaved && savedAtLabel(lastSaved)}
            {saveStatus === "error" && (
              <span className="text-red-400">Auto-save failed</span>
            )}
          </span>
        )}
      </div>

      {/* ══════════════════ PREVIEW ══════════════════ */}
      {mode === "preview" && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 border dark:border-white/10 rounded px-3 py-1.5 mb-6 inline-block">
            Preview — not yet published
          </p>

          <article className="py-4">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {isBreaking && (
                <span className="bg-brand-red text-white text-[11px] font-black px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                  Breaking
                </span>
              )}
              {selectedCategory && (
                <Badge className="bg-brand-red text-white">{selectedCategory.name}</Badge>
              )}
            </div>

            <h1 className="font-serif text-4xl font-bold leading-tight mb-2">
              {title || <span className="text-gray-300 dark:text-gray-600">Article title will appear here</span>}
            </h1>

            {subtitle && (
              <p className="font-serif text-xl text-gray-500 dark:text-gray-400 mb-4 leading-snug">{subtitle}</p>
            )}

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {dateline && (
                <span className="font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {dateline} —{" "}
                </span>
              )}
              Reported by {previewByline} · {formatDateTimeIST(new Date())}
            </p>

            {images[0] && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                <Image
                  src={images[0].url}
                  alt={images[0].caption || title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {images[0]?.caption && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-8 italic">{images[0].caption}</p>
            )}

            {body ? (
              <ArticleBody html={body} />
            ) : (
              <p className="text-gray-300 dark:text-gray-600 italic">Article body will appear here…</p>
            )}

            {aboutAuthors && (
              <div className="mt-10 border-t dark:border-white/10 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">About the Author{aboutAuthors.includes("\n\n") ? "s" : ""}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{aboutAuthors}</div>
              </div>
            )}
          </article>
        </div>
      )}

      {/* ══════════════════ EDIT FORM ══════════════════ */}
      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${mode === "preview" ? "hidden" : ""}`}
      >
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="text-base"
          />
        </div>

        {/* Subtitle / Deck */}
        <div className="space-y-1">
          <Label htmlFor="subtitle">
            Subtitle <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A supporting line that appears below the headline"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>

        {/* Reporter + Dateline side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="reporterName">Reporter Name</Label>
            <Input
              id="reporterName"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="e.g. Rina Chowdhury"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dateline">
              Dateline <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </Label>
            <Input
              id="dateline"
              value={dateline}
              onChange={(e) => setDateline(e.target.value)}
              placeholder="e.g. KOLKATA, India"
            />
          </div>
        </div>

        {/* SEO Keywords */}
        <div className="space-y-1">
          <Label htmlFor="seoKeywords">SEO Keywords</Label>
          <div className="flex gap-2">
            <Input
              id="seoKeywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const kw = keywordInput.trim().replace(/,$/, "");
                  if (!kw) return;
                  const existing = seoKeywords ? seoKeywords.split(",").map((k) => k.trim()) : [];
                  if (!existing.includes(kw)) setSeoKeywords([...existing, kw].join(","));
                  setKeywordInput("");
                }
              }}
              placeholder="Type a keyword and press Enter"
            />
            <button
              type="button"
              onClick={() => {
                const kw = keywordInput.trim();
                if (!kw) return;
                const existing = seoKeywords ? seoKeywords.split(",").map((k) => k.trim()) : [];
                if (!existing.includes(kw)) setSeoKeywords([...existing, kw].join(","));
                setKeywordInput("");
              }}
              className="shrink-0 px-3 py-1 text-sm rounded-md border border-input bg-transparent hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Add
            </button>
          </div>
          {seoKeywords && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {seoKeywords
                .split(",")
                .map((kw) => kw.trim())
                .filter(Boolean)
                .map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        setSeoKeywords(
                          seoKeywords
                            .split(",")
                            .map((k) => k.trim())
                            .filter((k) => k && k !== kw)
                            .join(","),
                        )
                      }
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Keywords help search engines understand what this article is about.
          </p>
        </div>

        {/* Excerpt with character counter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="excerpt">Excerpt</Label>
            <span
              className={`text-xs tabular-nums ${
                excerptLen > EXCERPT_LIMIT
                  ? "text-red-500 font-semibold"
                  : excerptLen > EXCERPT_LIMIT * 0.85
                  ? "text-amber-500"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {excerptLen}/{EXCERPT_LIMIT}
            </span>
          </div>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            required
            className={excerptLen > EXCERPT_LIMIT ? "border-red-300 focus-visible:ring-red-300" : ""}
          />
          {excerptLen > EXCERPT_LIMIT && (
            <p className="text-xs text-red-500">
              Excerpt exceeds {EXCERPT_LIMIT} characters — Google may truncate the meta description.
            </p>
          )}
          {excerptLen === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              This appears as the article summary and Google meta description (keep under {EXCERPT_LIMIT} chars).
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Breaking news flag */}
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3">
          <input
            id="isBreaking"
            type="checkbox"
            checked={isBreaking}
            onChange={(e) => setIsBreaking(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-red cursor-pointer"
          />
          <div>
            <label htmlFor="isBreaking" className="text-sm font-medium cursor-pointer select-none">
              Mark as Breaking News
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Shows a prominent{" "}
              <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                BREAKING
              </span>{" "}
              badge on the article page.
            </p>
          </div>
        </div>

        {/* Photos */}
        <ArticleImageManager images={images} onChange={setImages} editorRef={editorRef} />

        {/* Body */}
        <div className="space-y-1">
          <Label>Body</Label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Click in the editor first, then use &ldquo;Insert&rdquo; on any additional photo to place it inline.
          </p>
          <RichTextEditor value={body} onChange={setBody} editorRef={editorRef} />
          {/* Word count */}
          <div className="flex items-center justify-end gap-3 text-xs text-gray-400 dark:text-gray-500 pt-1">
            <span>{words.toLocaleString()} words</span>
            <span>·</span>
            <span>{readingMins} min read</span>
          </div>
        </div>

        {/* Twitter embed */}
        <div className="space-y-1">
          <Label htmlFor="twitterUrl">Twitter / X Post URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></Label>
          <Input
            id="twitterUrl"
            type="url"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://twitter.com/user/status/..."
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">Paste a tweet URL to embed it inside the article.</p>
        </div>

        {/* About Authors */}
        <div className="space-y-1">
          <Label htmlFor="aboutAuthors">
            About the Author(s) <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="aboutAuthors"
            value={aboutAuthors}
            onChange={(e) => setAboutAuthors(e.target.value)}
            rows={4}
            placeholder={"e.g. Rina Chowdhury is a senior correspondent covering politics and governance.\n\nArjun Sen is a data journalist based in Mumbai."}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Appears at the bottom of the published article. Use a blank line to separate multiple author bios.
          </p>
        </div>

        {/* Author Photo */}
        <div className="space-y-2">
          <Label>Author Photo</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-white/10 flex-shrink-0 hover:opacity-75 transition-opacity"
              onClick={() => authorImageRef.current?.click()}
              title="Click to change photo"
            >
              <Image
                src={authorImage}
                alt="Author"
                fill
                className="object-cover"
              />
            </button>
            <div className="space-y-1">
              <button
                type="button"
                className="text-sm text-brand-red hover:underline disabled:opacity-50"
                disabled={authorImageUploading}
                onClick={() => authorImageRef.current?.click()}
              >
                {authorImageUploading ? "Uploading…" : "Change photo"}
              </button>
              {authorImage !== "/prasanta_profile_image.jpg" && (
                <button
                  type="button"
                  className="block text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setAuthorImage("/prasanta_profile_image.jpg")}
                >
                  Reset to default
                </button>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">Shown in the &quot;About the Author&quot; box.</p>
            </div>
          </div>
          <input
            ref={authorImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setAuthorImageUploading(true);
              const form = new FormData();
              form.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: form });
              const data = await res.json();
              setAuthorImageUploading(false);
              if (res.ok) setAuthorImage(data.url);
            }}
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-red hover:bg-brand-red/90 text-white"
          >
            {saving ? "Saving…" : article ? "Update Article" : "Create Article"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
