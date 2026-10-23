import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { classifyDevice } from "@/lib/device";
import { INTERNAL_REFERRER, PUSH_REFERRER, isOwnSiteHost } from "@/lib/metrics";

const VISITOR_COOKIE = "enn_vid";

// `referrer` is sent by the page (see ViewTracker) — this request's own Referer header is always
// the article itself. Visits from another page on this site are stored as INTERNAL_REFERRER.
function getReferrerHost(referrer: unknown, requestHost: string): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().slice(0, 255);
    if (!host) return null;
    return host === requestHost || isOwnSiteHost(host) ? INTERNAL_REFERRER : host;
  } catch {
    return null;
  }
}

// Cloudflare reports "XX" when it can't place an IP and "T1" for Tor exit nodes.
const UNKNOWN_COUNTRIES = new Set(["XX", "T1"]);

// Cloudflare geolocates every request at the edge and attaches the result as
// request.cf, so there's nothing to look up.
function getGeo() {
  const cf = getCloudflareContext().cf as { country?: string; region?: string; city?: string } | undefined;
  const country = cf?.country && !UNKNOWN_COUNTRIES.has(cf.country) ? cf.country : null;
  return { country, region: cf?.region || null, city: cf?.city || null };
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const geo = getGeo();

  const body = (await request.json().catch(() => null)) as { referrer?: unknown; source?: unknown } | null;
  const referrerHost =
    body?.source === "push" ? PUSH_REFERRER : getReferrerHost(body?.referrer, request.nextUrl.hostname);
  const userAgent = request.headers.get("user-agent");
  const deviceType = userAgent ? classifyDevice(userAgent) : null;

  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? randomUUID();

  const view = await prisma.articleView.create({
    data: { articleId: params.id, ...geo, referrerHost, userAgent, deviceType, visitorId },
    select: { id: true },
  });

  const response = NextResponse.json({ ok: true, viewId: view.id });
  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
