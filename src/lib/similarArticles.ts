import { prisma } from "@/lib/prisma";

const SIMILAR_LIMIT = 4;

const include = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const;

// Latest stories from the same category, topped up with title/keyword matches
// when the category alone doesn't fill the row. `id` is null for an article
// that hasn't been saved yet (the editor preview).
export async function getSimilarArticles({
  id,
  categoryId,
  title,
}: {
  id: string | null;
  categoryId: string;
  title: string;
}) {
  const similarArticles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      categoryId,
      ...(id ? { id: { not: id } } : {}),
    },
    include,
    orderBy: { publishedAt: "desc" },
    take: SIMILAR_LIMIT,
  });

  if (similarArticles.length < SIMILAR_LIMIT) {
    const keywords = Array.from(
      new Set(
        title
          .split(/\W+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 3)
      )
    ).slice(0, 6);

    if (keywords.length > 0) {
      const excludeIds = [...(id ? [id] : []), ...similarArticles.map((a) => a.id)];
      const keywordMatches = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: excludeIds },
          OR: keywords.flatMap((word) => [
            { title: { contains: word, mode: "insensitive" as const } },
            { seoKeywords: { contains: word, mode: "insensitive" as const } },
          ]),
        },
        include,
        orderBy: { publishedAt: "desc" },
        take: SIMILAR_LIMIT - similarArticles.length,
      });
      similarArticles.push(...keywordMatches);
    }
  }

  return similarArticles;
}
