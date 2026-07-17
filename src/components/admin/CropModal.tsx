"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";

interface Props {
  src: string;
  onDone: (blob: Blob) => void;
  onClose: () => void;
}

export default function CropModal({ src, onDone, onClose }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  const [completed, setCompleted] = useState<PixelCrop | null>(null);
  const [applying, setApplying] = useState(false);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setCompleted({ unit: "px", x: 0, y: 0, width: img.width, height: img.height });
  }

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !completed) return;
    setApplying(true);

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(completed.width * scaleX);
    canvas.height = Math.round(completed.height * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setApplying(false); return; }

    ctx.drawImage(
      img,
      Math.round(completed.x * scaleX),
      Math.round(completed.y * scaleY),
      canvas.width,
      canvas.height,
      0, 0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        setApplying(false);
        if (blob) onDone(blob);
      },
      "image/jpeg",
      0.92,
    );
  }, [completed, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b dark:border-white/10">
          <h2 className="font-semibold text-sm dark:text-gray-100">Crop Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 max-h-[62vh] overflow-auto bg-gray-50 dark:bg-white/5 flex items-center justify-center">
          <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompleted} keepSelection>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              style={{ maxHeight: "56vh", maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-gray-500">Drag to adjust the crop area</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={applying || !completed}
              onClick={handleApply}
              className="bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {applying ? "Applying…" : "Apply Crop"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
