"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import {
  ImagePlus, Crop as CropIcon, Trash2, ChevronUp, ChevronDown, CornerDownRight,
} from "lucide-react";
import CropModal from "./CropModal";
import type { Editor } from "@tiptap/core";

export type ArticleImage = { url: string; caption: string };

interface Props {
  images: ArticleImage[];
  onChange: (images: ArticleImage[]) => void;
  editorRef: React.MutableRefObject<Editor | null>;
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function ArticleImageManager({ images, onChange, editorRef }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropTarget, setCropTarget] = useState<{ index: number; src: string } | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data.url as string;
  }

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadFile));
      onChange([...images, ...urls.map((url) => ({ url, caption: "" }))]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function setCaption(i: number, caption: string) {
    onChange(images.map((img, idx) => (idx === i ? { ...img, caption } : img)));
  }

  function insertIntoArticle(img: ArticleImage) {
    const editor = editorRef.current;
    if (!editor) return;
    const captionHtml = img.caption
      ? `<p><em>${escapeHtml(img.caption)}</em></p>`
      : "";
    editor
      .chain()
      .focus()
      .insertContent(
        `<img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.caption)}" />${captionHtml}`,
      )
      .run();
  }

  async function handleCropDone(blob: Blob) {
    if (cropTarget === null) return;
    setCropUploading(true);
    try {
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const url = await uploadFile(file);
      onChange(images.map((img, idx) => (idx === cropTarget.index ? { ...img, url } : img)));
      setCropTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setCropUploading(false);
    }
  }

  const cover = images[0] ?? null;
  const rest = images.slice(1);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Photos</Label>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-dashed border-gray-300 dark:border-white/20 hover:border-brand-red hover:text-brand-red transition-colors disabled:opacity-50"
        >
          <ImagePlus size={14} />
          {uploading ? "Uploading…" : "Add Photos"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Empty state */}
      {images.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:border-brand-red hover:text-brand-red transition-colors"
        >
          <ImagePlus size={30} />
          <span className="text-sm font-medium">Click to add photos</span>
          <span className="text-xs">The first photo becomes the cover image</span>
        </button>
      )}

      {/* Cover photo */}
      {cover && (
        <div className="rounded-xl border-2 border-brand-red/40 bg-red-50/40 dark:bg-brand-red/10 overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-0">
            <span className="inline-flex items-center gap-1 bg-brand-red text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
              ★ COVER PHOTO
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">This image appears at the top of the article</span>
          </div>

          <div className="relative w-full aspect-video mt-3 bg-gray-200 dark:bg-white/10">
            <Image src={cover.url} alt="Cover" fill className="object-cover" unoptimized />
          </div>

          <div className="px-4 py-3 space-y-2">
            <input
              type="text"
              value={cover.caption}
              onChange={(e) => setCaption(0, e.target.value)}
              placeholder="Add a caption for this photo…"
              className="w-full text-sm px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
            <div className="flex items-center gap-2">
              <IconBtn
                label="Move down"
                disabled={images.length < 2}
                onClick={() => move(0, 1)}
              >
                <ChevronDown size={13} />
              </IconBtn>
              <IconBtn label="Crop" onClick={() => setCropTarget({ index: 0, src: cover.url })}>
                <CropIcon size={13} />
                <span className="text-xs">Crop</span>
              </IconBtn>
              <IconBtn
                label="Remove"
                danger
                onClick={() => remove(0)}
              >
                <Trash2 size={13} />
                <span className="text-xs">Remove</span>
              </IconBtn>
            </div>
          </div>
        </div>
      )}

      {/* Additional photos */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Additional Photos — click &ldquo;Insert&rdquo; to place in article body
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rest.map((img, i) => {
              const realIdx = i + 1;
              return (
                <div
                  key={`${img.url}-${realIdx}`}
                  className="rounded-lg border dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="relative w-full aspect-square bg-gray-100 dark:bg-white/10">
                    <Image
                      src={img.url}
                      alt={img.caption || `Photo ${realIdx + 1}`}
                      fill
                      className="object-cover"
                                         />
                  </div>

                  <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) => setCaption(realIdx, e.target.value)}
                      placeholder="Caption…"
                      className="w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />

                    <div className="flex flex-wrap gap-1 items-center">
                      <IconBtn
                        label="Move up (make cover)"
                        onClick={() => move(realIdx, -1)}
                        small
                      >
                        <ChevronUp size={11} />
                      </IconBtn>
                      <IconBtn
                        label="Move down"
                        onClick={() => move(realIdx, 1)}
                        disabled={realIdx === images.length - 1}
                        small
                      >
                        <ChevronDown size={11} />
                      </IconBtn>
                      <IconBtn
                        label="Crop"
                        onClick={() => setCropTarget({ index: realIdx, src: img.url })}
                        small
                      >
                        <CropIcon size={11} />
                      </IconBtn>
                      <IconBtn label="Remove" danger onClick={() => remove(realIdx)} small>
                        <Trash2 size={11} />
                      </IconBtn>

                      {/* Insert into article */}
                      <button
                        type="button"
                        title="Insert into article at cursor position"
                        onClick={() => insertIntoArticle(img)}
                        className="ml-auto flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      >
                        <CornerDownRight size={10} />
                        Insert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Crop modal */}
      {cropTarget && (
        <CropModal
          src={cropTarget.src}
          onDone={handleCropDone}
          onClose={() => setCropTarget(null)}
        />
      )}

      {/* Crop upload overlay */}
      {cropUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-lg px-6 py-4 text-sm text-gray-700 dark:text-gray-300 shadow-xl">
            Uploading cropped image…
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
  disabled,
  small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-0.5 rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        small ? "p-0.5" : "px-2 py-1"
      } ${
        danger
          ? "border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
