import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = "https://easternnewsnetwork.com";
const SITE_TITLE = "Eastern News Network";
const SITE_DESCRIPTION =
  "Independent news from the East — politics, economy, society, and culture.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      coverImage: true,
      reporterName: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const lastBuildDate = (articles[0]?.publishedAt ?? new Date()).toUTCString();

  const items = articles
    .map((a) => {
      const url = `${BASE_URL}/article/${a.slug}`;
      const byline = a.reporterName ?? a.author.name;
      const pubDate = (a.publishedAt ?? a.createdAt).toUTCString();
      // <enclosure> requires a byte length we don't store and a fixed MIME type;
      // media:content is what Feedly, Google News and most readers use for thumbnails.
      const media = a.coverImage
        ? `\n      <media:content url="${escapeXml(a.coverImage)}" medium="image" />\n      <media:thumbnail url="${escapeXml(a.coverImage)}" />`
        : "";

      return `    <item>
      <title>${cdata(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.category.name)}</category>
      <dc:creator>${cdata(byline)}</dc:creator>
      <description>${cdata(a.excerpt)}</description>
      <content:encoded>${cdata(a.body)}</content:encoded>${media}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-in</language>
    <image>
      <url>${BASE_URL}/android-chrome-192x192.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${BASE_URL}</link>
    </image>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
