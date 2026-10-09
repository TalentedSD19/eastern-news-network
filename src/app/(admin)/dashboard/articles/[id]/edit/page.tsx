import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import type { ArticleWithRelations } from "@/types";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const [article, categories] = await Promise.all([
    prisma.article.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <div>
      <ArticleForm
        article={article as ArticleWithRelations}
        categories={categories}
        authorName={article.author.name}
        siteHeader={<SiteHeader preview />}
        siteFooter={<SiteFooter />}
      />
    </div>
  );
}
