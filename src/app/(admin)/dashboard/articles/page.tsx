import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import DeleteArticleButton from "./DeleteArticleButton";
import PublishToggleButton from "./PublishToggleButton";

export const dynamic = "force-dynamic";

export default async function ArticlesListPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { views: true, comments: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Articles</h1>
        <Link
          href="/dashboard/articles/new"
          className={cn(buttonVariants(), "bg-brand-red hover:bg-brand-red/90 text-white")}
        >
          New Article
        </Link>
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                <TableCell>{a.category.name}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"}>
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">{a._count.views}</TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">{a._count.comments}</TableCell>
                <TableCell>{formatDate(a.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <PublishToggleButton id={a.id} currentStatus={a.status} />
                    <Link
                      href={`/dashboard/articles/${a.id}/metrics`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Metrics
                    </Link>
                    <Link
                      href={`/dashboard/articles/${a.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                    <DeleteArticleButton id={a.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 dark:text-gray-500 py-10">
                  No articles yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
