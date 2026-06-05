import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, excerpt, body: content, coverImage, images,
    subtitle, dateline, isBreaking,
    categoryId, status, reporterName, twitterUrl, seoKeywords, aboutAuthors, authorImage,
  } = body;

  if (!title || !excerpt || !content || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Derive coverImage from first image in the array if not explicitly provided
  const resolvedCover = coverImage ?? (Array.isArray(images) && images[0]?.url ? images[0].url : null);

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      excerpt,
      body: content,
      coverImage: resolvedCover || null,
      images: Array.isArray(images) ? images : [],
      subtitle: subtitle || null,
      dateline: dateline || null,
      isBreaking: isBreaking === true,
      reporterName: reporterName || null,
      twitterUrl: twitterUrl || null,
      seoKeywords: seoKeywords || null,
      aboutAuthors: aboutAuthors || null,
      authorImage: authorImage || null,
      categoryId,
      authorId: session.user.id,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(article, { status: 201 });
}
