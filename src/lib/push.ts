import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? SITE_URL;

const configured = Boolean(publicKey && privateKey);
if (configured) webpush.setVapidDetails(subject, publicKey!, privateKey!);

type PublishedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  isBreaking: boolean;
  publishedAt: Date | null;
};

// Notification bodies get cut off after a couple of lines on most systems, so trim
// the excerpt at a word boundary instead of letting the OS chop it mid-word.
const BODY_MAX_CHARS = 140;

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}

// Fans a "new article" notification out to every subscribed browser.
// Subscriptions the push service reports as gone (404/410) are pruned.
export async function notifyNewArticle(article: PublishedArticle) {
  if (!configured) return;

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: article.isBreaking ? `BREAKING: ${article.title}` : article.title,
    body: truncate(article.excerpt, BODY_MAX_CHARS),
    image: article.coverImage ?? undefined,
    // Tagged so the article's view tracker can count visits that came from an alert.
    url: `/article/${article.slug}?utm_source=push&utm_medium=notification`,
    tag: article.slug,
    timestamp: (article.publishedAt ?? new Date()).getTime(),
  });
  // Breaking news is delivered right away even to phones in battery saver; other stories
  // can wait for the push service's normal schedule.
  const urgency = article.isBreaking ? "high" : "normal";

  const expired: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60 * 12, urgency, timeout: 10_000 }
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(sub.endpoint);
        else console.error("Push send failed", status, error);
      }
    })
  );

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expired } } });
  }
}
