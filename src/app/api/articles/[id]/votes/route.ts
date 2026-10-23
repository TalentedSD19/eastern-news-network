import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getVoteCounts(articleId: string) {
  const rows = await prisma.vote.groupBy({
    by: ["voteType"],
    where: { articleId },
    _count: { id: true },
  });
  const up = rows.find((r) => r.voteType === "UP")?._count.id ?? 0;
  const down = rows.find((r) => r.voteType === "DOWN")?._count.id ?? 0;
  return { up, down };
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const voterToken = request.nextUrl.searchParams.get("voterToken");
  const counts = await getVoteCounts(params.id);

  let userVote: "UP" | "DOWN" | null = null;
  if (voterToken) {
    const existing = await prisma.vote.findUnique({
      where: { articleId_voterToken: { articleId: params.id, voterToken } },
      select: { voteType: true },
    });
    userVote = existing?.voteType ?? null;
  }

  return NextResponse.json({ ...counts, userVote });
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const body = await request.json();
  const voterToken = (body.voterToken ?? "").trim().slice(0, 64);
  const voteType: "UP" | "DOWN" = body.voteType === "DOWN" ? "DOWN" : "UP";

  if (!voterToken) {
    return NextResponse.json({ error: "voterToken required" }, { status: 400 });
  }

  await prisma.vote.upsert({
    where: { articleId_voterToken: { articleId: params.id, voterToken } },
    update: { voteType },
    create: { articleId: params.id, voterToken, voteType },
  });

  const counts = await getVoteCounts(params.id);
  const existing = await prisma.vote.findUnique({
    where: { articleId_voterToken: { articleId: params.id, voterToken } },
    select: { voteType: true },
  });

  return NextResponse.json({ ...counts, userVote: existing?.voteType ?? null });
}
