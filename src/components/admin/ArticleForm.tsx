"use client";

import { useRef, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/core";
import Image from "next/image";
import { ArrowLeft, Eye, PencilLine, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ArticleImageManager, { type ArticleImage } from "./ArticleImageManager";
import ArticlePreview from "./ArticlePreview";
import { cn, slugify } from "@/lib/utils";
import { SITE_URL } from "@/lib/seo";
import type { ArticleWithRelations } from "@/types";
import { uploadImage } from "@/lib/uploadImage";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

type Category = { id: string; name: string; slug: string };
type Status = "DRAFT" | "PUBLISHED";

interface Props {
  article?: ArticleWithRelations;
  categories: Category[];
  /** Byline used when no reporter name is set: the article's author, or the current user for a new one. */
  authorName: string;
  /** The public site header and footer, rendered on the server, framing the preview. */
  siteHeader: ReactNode;
  siteFooter: ReactNode;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const EXCERPT_LIMIT = 160;
const DEFAULT_AUTHOR_IMAGE = "/prasanta_profile_image.jpg";
const ABOUT_AUTHOR_PLACEHOLDER = "Prasanta Paul served Deccan Herald as the Chief of Bureau, Calcutta …";

function initImages(article?: ArticleWithRelations): ArticleImage[] {
  if (!article) return [];
  const stored = article.images as ArticleImage[] | null | undefined;
  if (Array.isArray(stored) && stored.length > 0) return stored;
  if (article.coverImage) return [{ url: article.coverImage, caption: "" }];
  return [];
}

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html: string): number {
  const text = htmlToText(html);
  return text ? text.split(" ").filter(Boolean).length : 0;
}

function savedAtLabel(date: Date): string {
  return `Saved at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

// ── Small layout pieces ─────────────────────────────────────────────────────
function Card({ title, description, children, className }: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-white dark:bg-neutral-900 border border-gray-200/70 dark:border-white/10 rounded-xl shadow-sm p-5", className)}>
      {title && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function Optional() {
  return <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>;
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-400 dark:text-gray-500">{children}</p>;
}

function CheckOption({ id, checked, onChange, label, hint }: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2.5 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-accent cursor-pointer"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function ArticleForm({ article, categories, authorName, siteHeader, siteFooter }: Props) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(article?.title ?? "");
  // New articles take their address from the headline (the server makes it unique); existing ones can edit it.
  const [editedSlug, setSlug] = useState(article?.slug ?? "");
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
  const [authorImage, setAuthorImage] = useState(article?.authorImage ?? DEFAULT_AUTHOR_IMAGE);
  const [authorImageUploading, setAuthorImageUploading] = useState(false);
  const authorImageRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(article?.status ?? "DRAFT");
  const [notify, setNotify] = useState(true);
  // Subscribers are only notified the first time an article goes live.
  const alreadyAnnounced = Boolean(article?.publishedAt);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  // Going live or coming off the site is asked about first, so it never happens by accident.
  const [confirming, setConfirming] = useState<"publish" | "unpublish" | null>(null);
  const submitted = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const words = useMemo(() => wordCount(body), [body]);
  const readingMins = Math.max(1, Math.ceil(words / 200));
  const excerptLen = excerpt.length;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const previewByline = reporterName || authorName;
  const keywords = seoKeywords.split(",").map((k) => k.trim()).filter(Boolean);
  const isPublished = status === "PUBLISHED";
  const slug = article ? editedSlug : slugify(title);

  // What each save needs — drafts only need the headline and category (see `save`).
  const checklist = [
    { id: "title", label: "Headline", done: title.trim().length > 0, required: true },
    { id: "category", label: "Category", done: Boolean(categoryId), required: true },
    { id: "body", label: "Body", done: words > 0, required: true },
    { id: "excerpt", label: "Excerpt", done: excerpt.trim().length > 0, required: true },
    { id: "photos", label: "Cover photo", done: images.length > 0, required: false },
  ];

  // Everything the API saves, serialised — compared against the last saved copy to know what's unsaved.
  const payloadJson = JSON.stringify({
    title, slug, subtitle, dateline, isBreaking,
    reporterName, excerpt, body,
    coverImage: images[0]?.url ?? null, images,
    categoryId, twitterUrl, seoKeywords, aboutAuthors, authorImage, status, notify,
  });
  const savedJson = useRef(payloadJson);

  const isDirty = article
    ? saveStatus === "unsaved" || saveStatus === "saving"
    : Boolean(title || subtitle || excerpt || words > 0 || images.length);

  // Grow the headline box with its text.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title, mode]);

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty || submitted.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ── Auto-save (edit mode only, 5 s debounce) ──────────────────────────────
  useEffect(() => {
    if (!article?.id) return;
    if (payloadJson === savedJson.current) {
      setSaveStatus((prev) => (prev === "unsaved" ? "idle" : prev));
      return;
    }

    setSaveStatus("unsaved");
    const json = payloadJson;
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/articles/${article.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        if (res.ok) {
          savedJson.current = json;
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
  }, [payloadJson, article?.id]);

  function focusField(id: string) {
    setMode("edit");
    requestAnimationFrame(() => {
      if (id === "body") {
        editorRef.current?.commands.focus();
        document.getElementById("body-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async (nextStatus: Status, confirmed = false) => {
    if (saving) return;
    // Drafts only need what the database requires; going live needs everything readers see.
    const missing = checklist.filter((c) =>
      nextStatus === "PUBLISHED" ? c.required && !c.done : (c.id === "title" || c.id === "category") && !c.done
    );
    if (missing.length > 0) {
      const names = missing.map((m) => m.label.toLowerCase());
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      setError(`Add the ${list} before ${nextStatus === "PUBLISHED" ? "publishing" : "saving"}.`);
      focusField(missing[0].id);
      return;
    }

    if (!confirmed && nextStatus !== status) {
      setError("");
      setConfirming(nextStatus === "PUBLISHED" ? "publish" : "unpublish");
      return;
    }
    setConfirming(null);

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaving(nextStatus);
    setError("");

    const json = JSON.stringify({ ...JSON.parse(payloadJson), status: nextStatus });

    try {
      const res = await fetch(article ? `/api/articles/${article.id}` : "/api/articles", {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSaving(null);
        return;
      }

      submitted.current = true;
      if (nextStatus === "PUBLISHED" && status !== "PUBLISHED") {
        // Just went live — back to the list, which shows a "now live" note with a link to it.
        router.push(`/dashboard/articles?published=${encodeURIComponent(data.id ?? article?.id ?? "")}`);
        router.refresh();
      } else if (!article) {
        // New draft — keep writing in the editor, where auto-save now takes over.
        router.replace(`/dashboard/articles/${data.id}/edit`);
        router.refresh();
      } else {
        submitted.current = false;
        savedJson.current = json; // matches the form once `status` updates, so no auto-save follows
        setStatus(nextStatus);
        setSaveStatus("saved");
        setLastSaved(new Date());
        setSaving(null);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSaving(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, checklist, article, status, payloadJson]);

  // Ctrl/Cmd+S saves without changing the article's status.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(status);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, status]);

  function leave() {
    if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return;
    submitted.current = true;
    router.push("/dashboard/articles");
  }

  function addKeyword(raw: string) {
    const kw = raw.trim().replace(/,$/, "");
    if (kw && !keywords.includes(kw)) setSeoKeywords([...keywords, kw].join(","));
    setKeywordInput("");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const saveLabel = article
    ? saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "unsaved"
        ? "Unsaved changes"
        : saveStatus === "error"
          ? "Auto-save failed"
          : saveStatus === "saved" && lastSaved
            ? savedAtLabel(lastSaved)
            : "All changes saved"
    : "Not saved yet";

  return (
    <div>
      {/* ── Top bar ── */}
      <div className="md:sticky md:top-0 z-30 -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-6 px-4 sm:px-6 md:px-8 py-3 bg-gray-50/90 dark:bg-background/90 backdrop-blur border-b border-gray-200/70 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={leave}
            className="inline-flex items-center justify-center size-8 rounded-md text-gray-500 hover:bg-gray-200/60 dark:hover:bg-white/10"
            aria-label="Back to articles"
            title="Back to articles"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 mr-auto">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-medium tracking-tight text-lg truncate">
                {article ? "Edit article" : "New article"}
              </h1>
              <span
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  isPublished
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                )}
              >
                <span className={cn("size-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-gray-400")} />
                {isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <p className={cn("text-xs", saveStatus === "error" ? "text-red-500" : "text-gray-400 dark:text-gray-500")}>
              {saveLabel}
            </p>
          </div>

          {/* Edit / Preview switch */}
          <div className="inline-flex rounded-lg bg-gray-200/60 dark:bg-white/10 p-0.5" role="tablist">
            {([
              { value: "edit", label: "Write", icon: PencilLine },
              { value: "preview", label: "Preview", icon: Eye },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  // Start the preview at the top of the article, not wherever the form was scrolled to.
                  if (value === "preview") window.scrollTo({ top: 0 });
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-colors",
                  mode === value
                    ? "bg-white dark:bg-neutral-800 shadow-sm text-gray-900 dark:text-gray-50"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isPublished ? (
              <Button type="button" variant="outline" disabled={Boolean(saving)} onClick={() => save("DRAFT")}>
                {saving === "DRAFT" ? "Unpublishing…" : "Unpublish"}
              </Button>
            ) : (
              <Button type="button" variant="outline" disabled={Boolean(saving)} onClick={() => save("DRAFT")}>
                {saving === "DRAFT" ? "Saving…" : "Save draft"}
              </Button>
            )}
            <Button
              type="button"
              disabled={Boolean(saving)}
              onClick={() => save("PUBLISHED")}
              className="bg-brand-accent hover:bg-brand-accent-dark text-white"
            >
              {saving === "PUBLISHED" ? (isPublished ? "Updating…" : "Publishing…") : isPublished ? "Update" : "Publish"}
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════ PREVIEW ══════════════════ */}
      {mode === "preview" && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-white/5 border dark:border-white/10 rounded px-3 py-1.5 mb-6 inline-block">
            Preview — exactly as readers will see it. All links and buttons are disabled here.
          </p>

          <ArticlePreview
            articleId={article?.id ?? null}
            slug={slug}
            title={title}
            subtitle={subtitle}
            dateline={dateline}
            isBreaking={isBreaking}
            category={selectedCategory}
            byline={previewByline}
            date={article?.publishedAt ?? new Date()}
            body={body}
            coverImage={images[0]?.url ?? null}
            twitterUrl={twitterUrl}
            aboutAuthors={aboutAuthors}
            authorImage={authorImage}
            siteHeader={siteHeader}
            siteFooter={siteFooter}
          />
        </div>
      )}

      {/* ══════════════════ EDIT FORM ══════════════════ */}
      {/* Kept mounted in preview mode so the editor keeps its state. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save(status);
        }}
        className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start", mode === "preview" && "hidden")}
      >
        {/* ── Main column ── */}
        <div className="space-y-6 min-w-0">
          <Card>
            <label htmlFor="title" className="sr-only">Headline</label>
            <textarea
              id="title"
              ref={titleRef}
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="Headline"
              className="w-full resize-none overflow-hidden bg-transparent font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none"
            />
            <label htmlFor="subtitle" className="sr-only">Subtitle</label>
            <input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add a subtitle (optional)"
              className="mt-2 w-full bg-transparent text-base text-gray-600 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none"
            />

            {/* URL */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 min-w-0">
              <span className="shrink-0 font-medium text-gray-500 dark:text-gray-400">Link:</span>
              <span className="shrink-0">{SITE_URL.replace(/^https?:\/\//, "")}/article/</span>
              {article && editingSlug ? (
                <>
                  <input
                    id="slug"
                    value={slug}
                    autoFocus
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setEditingSlug(false);
                      }
                    }}
                    className="min-w-0 flex-1 rounded border border-input bg-transparent px-1.5 py-0.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setEditingSlug(false)} className="shrink-0 text-brand-accent hover:underline">
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span className="truncate text-gray-600 dark:text-gray-300">{slug || "your-headline-here"}</span>
                  {article && (
                    <button type="button" onClick={() => setEditingSlug(true)} className="shrink-0 text-brand-accent hover:underline">
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </Card>


          <Card title="Excerpt" description="Shown on the home page, in article cards and as the Google description.">
            <Label htmlFor="excerpt" className="sr-only">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="One or two sentences that make readers want to click."
              className={excerptLen > EXCERPT_LIMIT ? "border-red-300 focus-visible:ring-red-300" : ""}
            />
            <div className="mt-1.5 flex items-start gap-3 text-xs">
              <p className="flex-1 text-red-500">
                {excerptLen > EXCERPT_LIMIT && `Over ${EXCERPT_LIMIT} characters — Google will cut it off in search results.`}
              </p>
              <span
                className={cn(
                  "shrink-0 tabular-nums",
                  excerptLen > EXCERPT_LIMIT
                    ? "text-red-500 font-semibold"
                    : excerptLen > EXCERPT_LIMIT * 0.85
                      ? "text-amber-500"
                      : "text-gray-400 dark:text-gray-500"
                )}
              >
                {excerptLen}/{EXCERPT_LIMIT}
              </span>
            </div>
          </Card>

          <Card>
            <ArticleImageManager images={images} onChange={setImages} editorRef={editorRef} />
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              The first photo is the cover. To place another photo inside the story, click in the body where you want it, then press &ldquo;Insert&rdquo; on that photo.
            </p>
          </Card>

          <div id="body-section" className="space-y-2">
            <div className="flex items-end justify-between">
              <Label className="text-sm font-semibold">Body</Label>
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                {words.toLocaleString()} {words === 1 ? "word" : "words"} · {readingMins} min read
              </span>
            </div>
            <RichTextEditor value={body} onChange={setBody} editorRef={editorRef} />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <Card title="Publishing">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
                  <option value="" disabled>Choose a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <CheckOption
                id="isBreaking"
                checked={isBreaking}
                onChange={setIsBreaking}
                label="Breaking news"
                hint="Adds a red BREAKING badge."
              />
              {!alreadyAnnounced && (
                <CheckOption
                  id="notify"
                  checked={notify}
                  onChange={setNotify}
                  label="Notify readers"
                  hint="Send a browser notification when this goes live."
                />
              )}
            </div>
          </Card>

          <Card title="Author" description="The byline, and the bio shown at the end of the article.">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reporterName">Author Name</Label>
                <Input
                  id="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder={authorName}
                />
                <Hint>Leave empty to use {authorName}.</Hint>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateline">Place Name <Optional /></Label>
                <Input
                  id="dateline"
                  value={dateline}
                  onChange={(e) => setDateline(e.target.value)}
                  placeholder="e.g. KOLKATA, India"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <p className="text-sm font-medium mb-2">About the author <Optional /></p>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  className="relative size-12 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0 hover:opacity-75 transition-opacity"
                  onClick={() => authorImageRef.current?.click()}
                  title="Change photo"
                >
                  <Image src={authorImage} alt="Author" fill className="object-cover" />
                </button>
                <div className="text-sm">
                  <button
                    type="button"
                    className="text-brand-accent hover:underline disabled:opacity-50"
                    disabled={authorImageUploading}
                    onClick={() => authorImageRef.current?.click()}
                  >
                    {authorImageUploading ? "Uploading…" : "Change photo"}
                  </button>
                  {authorImage !== DEFAULT_AUTHOR_IMAGE && (
                    <button
                      type="button"
                      className="block text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setAuthorImage(DEFAULT_AUTHOR_IMAGE)}
                    >
                      Reset to default
                    </button>
                  )}
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
                  try {
                    setAuthorImage(await uploadImage(file));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Couldn't upload the photo.");
                  } finally {
                    setAuthorImageUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <Label htmlFor="aboutAuthors" className="sr-only">About the author(s)</Label>
              <Textarea
                id="aboutAuthors"
                value={aboutAuthors}
                onChange={(e) => setAboutAuthors(e.target.value)}
                rows={4}
                placeholder={ABOUT_AUTHOR_PLACEHOLDER}
              />
              <div className="mt-1.5">
                <Hint>Separate multiple bios with a blank line.</Hint>
              </div>
            </div>
          </Card>

          <Card title="Search keywords" description="Words people might type into Google to find this story. Press Enter after each one.">
            <div className="flex flex-wrap gap-1.5 rounded-md border border-input dark:bg-input/30 px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => setSeoKeywords(keywords.filter((k) => k !== kw).join(","))}
                    className="rounded-full p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={`Remove ${kw}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id="seoKeywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword(keywordInput);
                  } else if (e.key === "Backspace" && !keywordInput && keywords.length) {
                    setSeoKeywords(keywords.slice(0, -1).join(","));
                  }
                }}
                onBlur={() => keywordInput && addKeyword(keywordInput)}
                placeholder={keywords.length ? "Add another…" : "e.g. Durga Puja"}
                className="flex-1 min-w-[8rem] bg-transparent text-sm py-0.5 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </Card>

          <Card title="Twitter / X post" description="Paste the link to a tweet to show it inside the article.">
            <Label htmlFor="twitterUrl" className="sr-only">Twitter / X post URL</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/user/status/…"
            />
          </Card>

          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
            Tip: press <kbd className="rounded border border-gray-200 dark:border-white/15 px-1 font-sans">Ctrl</kbd>+
            <kbd className="rounded border border-gray-200 dark:border-white/15 px-1 font-sans">S</kbd> to save.
          </p>
        </aside>
      </form>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        {/* Focus starts on Cancel, so a stray Enter can't publish or unpublish. */}
        <DialogContent initialFocus={cancelRef}>
          {confirming === "publish" ? (
            <>
              <DialogHeader>
                <DialogTitle>Publish this article?</DialogTitle>
                <DialogDescription>
                  &ldquo;{title}&rdquo; will appear on the website straight away.
                </DialogDescription>
              </DialogHeader>
              {!alreadyAnnounced && (
                <CheckOption
                  id="notify-confirm"
                  checked={notify}
                  onChange={setNotify}
                  label="Notify readers"
                  hint="Send a browser notification to readers who signed up for alerts."
                />
              )}
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Take this article off the site?</DialogTitle>
              <DialogDescription>
                Readers won&rsquo;t be able to see it any more. It&rsquo;s kept as a draft, so you can publish it again later.
              </DialogDescription>
            </DialogHeader>
          )}
          <DialogFooter>
            <DialogClose ref={cancelRef} render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              disabled={Boolean(saving)}
              onClick={() => save(confirming === "publish" ? "PUBLISHED" : "DRAFT", true)}
              className={confirming === "publish" ? "bg-brand-accent hover:bg-brand-accent-dark text-white" : undefined}
              variant={confirming === "publish" ? "default" : "destructive"}
            >
              {confirming === "publish" ? "Publish now" : "Unpublish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
