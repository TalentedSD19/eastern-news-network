import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clamp(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function POST(request: NextRequest, { params }: { params: { viewId: string } }) {
  let body: { maxScrollPct?: unknown; activeSeconds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const maxScrollPct = clamp(body.maxScrollPct, 0, 100);
  const activeSeconds = clamp(body.activeSeconds, 0, 24 * 60 * 60);
  if (maxScrollPct === null && activeSeconds === null) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    await prisma.articleView.update({
      where: { id: params.viewId },
      data: {
        ...(maxScrollPct !== null ? { maxScrollPct } : {}),
        ...(activeSeconds !== null ? { activeSeconds } : {}),
      },
    });
  } catch {
    // Row may not exist (bad id, or already deleted) — beacons are best-effort, don't error loudly.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
