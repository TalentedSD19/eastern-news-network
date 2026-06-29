import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getGeoFromIp(ip: string) {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { cache: "no-store" });
    if (!res.ok) return { country: null, region: null, city: null };
    const data = await res.json();
    return {
      country: (data.country_code as string) ?? null,
      region: (data.region as string) ?? null,
      city: (data.city as string) ?? null,
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Use Vercel geo headers if present, otherwise fall back to IP lookup (Railway)
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-region");
  const city = request.headers.get("x-vercel-ip-city");

  let geo = { country, region, city };
  if (!country) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";
    if (ip !== "127.0.0.1") geo = await getGeoFromIp(ip);
  }

  await prisma.articleView.create({
    data: { articleId: params.id, ...geo },
  });

  return NextResponse.json({ ok: true });
}
