// Uploads an image through /api/upload and returns its public URL.
// Throws an Error with a readable message, even when the server's reply isn't JSON
// (e.g. an empty 500 from a crashed handler or an HTML error page from a proxy).
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

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
