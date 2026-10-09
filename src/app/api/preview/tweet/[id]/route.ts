import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTweet } from "react-tweet/api";
import { authOptions } from "@/lib/auth";
import { normalizeTweet } from "@/lib/tweet";

// Tweet data for the editor preview, fetched the same way TweetEmbed does server-side.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!/^\d+$/.test(params.id)) return NextResponse.json(null, { status: 400 });

  try {
    const raw = await getTweet(params.id);
    return NextResponse.json(raw ? normalizeTweet(raw) : null);
  } catch {
    return NextResponse.json(null);
  }
}
