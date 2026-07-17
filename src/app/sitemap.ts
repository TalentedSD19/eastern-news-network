import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const BASE_URL = "https://easternnewsnetwork.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, publishedAt: true, updatedAt: true, reporterName: true, author: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
  ]);

  const authorSlugs = new Set(articles.map((a) => slugify(a.reporterName ?? a.author.name)));
  const authorEntries: MetadataRoute.Sitemap = Array.from(authorSlugs).map((slug) => ({
    url: `${BASE_URL}/author/${slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/article/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/editorial-policy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...categoryEntries,
    ...authorEntries,
    ...articleEntries,
  ];
}
