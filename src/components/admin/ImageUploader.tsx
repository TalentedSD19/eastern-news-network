"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
    } else {
      onChange(data.url);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Cover Image</Label>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {uploading && <p className="text-sm text-gray-500 dark:text-gray-400">Uploading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden border dark:border-white/10">
          <Image src={value} alt="Cover preview" fill className="object-cover" />
        </div>
      )}
    </div>
  );
}
