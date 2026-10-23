import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authOptions } from "@/lib/auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicUrl) {
    console.error("Upload failed: missing env R2_PUBLIC_URL");
    return NextResponse.json(
      { error: "Image storage isn't configured on this server (missing R2_PUBLIC_URL)." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    // The bucket is bound to the Worker (ARTICLE_IMAGES in wrangler.jsonc), so no API keys are needed.
    await getCloudflareContext().env.ARTICLE_IMAGES.put(filename, await file.arrayBuffer(), {
      // Every filename is unique and never overwritten, so browsers and the CDN can cache it for 30 days.
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=2592000" },
    });
  } catch (error) {
    console.error("R2 upload failed", error);
    const detail = error instanceof Error ? ` (${error.name}: ${error.message})` : "";
    return NextResponse.json(
      // Show the storage error locally to make setup problems diagnosable; keep it generic in production.
      { error: `Couldn't store the image.${process.env.NODE_ENV === "production" ? " Please try again." : detail}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: `${publicUrl}/${filename}` });
}
