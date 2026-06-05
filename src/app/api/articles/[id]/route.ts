import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, slug: slugInput, excerpt, body: content, coverImage, images,
    subtitle, dateline, isBreaking,
    categoryId, status, reporterName, twitterUrl, seoKeywords, aboutAuthors, authorImage,
  } = body;
  const resolvedCover = coverImage ?? (Array.isArray(images) && images[0]?.url ? images[0].url : undefined);

  const [existing, actor] = await Promise.all([
    prisma.article.findUnique({ where: { id: params.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (actor?.role !== "ADMIN" && existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let slug = existing.slug;
  const desiredSlug = slugInput || (title ? slugify(title) : null);
  if (desiredSlug && desiredSlug !== existing.slug) {
    slug = desiredSlug;
    let suffix = 1;
    while (await prisma.article.findFirst({ where: { slug, NOT: { id: params.id } } })) {
      slug = `${desiredSlug}-${suffix++}`;
    }
  }

  const nowPublishing = status === "PUBLISHED" && existing.status !== "PUBLISHED";

  const article = await prisma.article.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      slug,
      ...(excerpt && { excerpt }),
      ...(content && { body: content }),
      ...(resolvedCover !== undefined && { coverImage: resolvedCover }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(subtitle !== undefined && { subtitle: subtitle || null }),
      ...(dateline !== undefined && { dateline: dateline || null }),
      ...(isBreaking !== undefined && { isBreaking: isBreaking === true }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(nowPublishing && { publishedAt: new Date() }),
      ...(reporterName !== undefined && { reporterName: reporterName || null }),
      ...(twitterUrl !== undefined && { twitterUrl: twitterUrl || null }),
      ...(seoKeywords !== undefined && { seoKeywords: seoKeywords || null }),
      ...(aboutAuthors !== undefined && { aboutAuthors: aboutAuthors || null }),
      ...(authorImage !== undefined && { authorImage: authorImage || null }),
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(article);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [existing, actor] = await Promise.all([
    prisma.article.findUnique({ where: { id: params.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (actor?.role !== "ADMIN" && existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.article.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
