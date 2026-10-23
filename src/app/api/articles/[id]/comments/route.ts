import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const comments = await prisma.comment.findMany({
    where: { articleId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const body = await request.json();
  const authorName = (body.authorName ?? "").trim().slice(0, 100);
  const text = (body.body ?? "").trim().slice(0, 2000);

  if (!authorName || !text) {
    return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { articleId: params.id, authorName, body: text },
  });
  return NextResponse.json(comment, { status: 201 });
}
