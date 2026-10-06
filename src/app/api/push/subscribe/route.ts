import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;

  if (
    typeof endpoint !== "string" || !endpoint.startsWith("https://") ||
    typeof p256dh !== "string" || typeof auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth },
    update: { p256dh, auth },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
  if (typeof body?.endpoint !== "string") {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ success: true });
}
