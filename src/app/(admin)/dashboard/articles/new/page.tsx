import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/admin/ArticleForm";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";

export default async function NewArticlePage() {
  const [session, categories] = await Promise.all([
    getServerSession(authOptions),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  // The API saves new articles under the signed-in user, so that's the default byline.
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
    : null;

  return (
    <div>
      <ArticleForm
        categories={categories}
        authorName={user?.name ?? session?.user?.name ?? "Reporter"}
        siteHeader={<SiteHeader preview />}
        siteFooter={<SiteFooter />}
      />
    </div>
  );
}
