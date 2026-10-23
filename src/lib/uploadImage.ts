// The widest slot (the homepage hero) is ~830 CSS px, so 2000px stays sharp on 2x laptop and 3x
// phone screens. Height gets more room so portraits cropped into wide slots keep their width.
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 3000;
// High enough that text in graphics and screenshots keeps crisp edges.
const QUALITY = 0.9;

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

// Downscales and re-encodes an image as WebP (JPEG where the browser can't encode WebP), so
// readers don't download multi-megabyte originals. GIFs are left alone to keep their animation,
// and the original is kept whenever re-encoding wouldn't make it smaller.
async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // Let the server reject or store it as-is
  }

  const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  let blob = await canvasToBlob(canvas, "image/webp");
  // Browsers that can't encode WebP silently return a PNG instead.
  if (blob?.type !== "image/webp") {
    // JPEG has no transparency, so paint transparent areas white rather than black.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, "image/jpeg");
  }
  bitmap.close();

  if (!blob || (scale === 1 && blob.size >= file.size)) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]*$/, "") + "." + ext;
  return new File([blob], name, { type: blob.type });
}

// Uploads an image through /api/upload and returns its public URL.
// Throws an Error with a readable message, even when the server's reply isn't JSON
// (e.g. an empty 500 from a crashed handler or an HTML error page from a proxy).
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", await compressImage(file));

  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body: form });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) {
    if (res.status === 413) throw new Error("That image is too large (max 5 MB).");
    throw new Error(data?.error ?? `Upload failed (server error ${res.status}).`);
  }
  return data.url;
}
