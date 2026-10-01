import { prisma } from "@/lib/prisma";

type WithByline = {
  authorImage: string | null;
  reporterName: string | null;
  author: { name: string };
};

const bylineOf = (a: { reporterName: string | null; author: { name: string } }) =>
  a.reporterName ?? a.author.name;

// Older articles were saved without an authorImage. Fill those from the most
// recent article by the same byline that has one, in a single query, so cards
// show the writer's photo instead of an initial. Bylines with no photo on any
// article stay null.
export async function fillAuthorImages<T extends WithByline>(articles: T[]): Promise<T[]> {
  const missing = Array.from(new Set(articles.filter((a) => !a.authorImage).map(bylineOf)));
  if (missing.length === 0) return articles;

  const sources = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      authorImage: { not: null },
      OR: [
        { reporterName: { in: missing } },
        { reporterName: null, author: { name: { in: missing } } },
      ],
    },
    select: { authorImage: true, reporterName: true, author: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const imageByByline = new Map<string, string>();
  for (const s of sources) {
    const byline = bylineOf(s);
    if (!imageByByline.has(byline)) imageByByline.set(byline, s.authorImage as string);
  }

  return articles.map((a) =>
    a.authorImage ? a : { ...a, authorImage: imageByByline.get(bylineOf(a)) ?? null }
  );
}
