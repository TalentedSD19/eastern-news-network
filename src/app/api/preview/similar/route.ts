import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSimilarArticles } from "@/lib/similarArticles";
import { fillAuthorImages } from "@/lib/authorImages";

// Similar stories for the editor preview, picked exactly as the article page does.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const categoryId = params.get("categoryId");
  if (!categoryId) return NextResponse.json([]);

  const articles = await getSimilarArticles({
    id: params.get("id") || null,
    categoryId,
    title: params.get("title") ?? "",
  });
  return NextResponse.json(await fillAuthorImages(articles));
}
