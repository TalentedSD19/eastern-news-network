import { prisma } from "@/lib/prisma";

const BASE_URL = "https://easternnewsnetwork.com";
const PUBLICATION_NAME = "Eastern News Network";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: twoDaysAgo } },
    select: { slug: true, title: true, publishedAt: true, category: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });

  const urls = articles
    .map((a) => {
      const loc = `${BASE_URL}/article/${a.slug}`;
      const pubDate = (a.publishedAt as Date).toISOString();
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
      <news:keywords>${escapeXml(a.category.name)}</news:keywords>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
