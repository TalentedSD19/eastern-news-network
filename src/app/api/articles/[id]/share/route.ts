import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_PLATFORMS = new Set([
  "WhatsApp",
  "Facebook",
  "X",
  "LinkedIn",
  "Email",
  "Instagram",
  "Copy link",
]);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let body: { platform?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shareClick.create({ data: { articleId: params.id, platform } });

  return NextResponse.json({ ok: true });
}
