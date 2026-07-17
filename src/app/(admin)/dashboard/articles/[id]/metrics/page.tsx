import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import MetricsStatCard from "@/components/admin/MetricsStatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ArticleMetricsPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  if (!article) notFound();

  const [totalViews, geoRows, voteRows, comments] = await Promise.all([
    prisma.articleView.count({ where: { articleId: params.id } }),
    prisma.articleView.groupBy({
      by: ["country", "region"],
      where: { articleId: params.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    prisma.vote.groupBy({
      by: ["voteType"],
      where: { articleId: params.id },
      _count: { id: true },
    }),
    prisma.comment.findMany({
      where: { articleId: params.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const upvotes = voteRows.find((r) => r.voteType === "UP")?._count.id ?? 0;
  const downvotes = voteRows.find((r) => r.voteType === "DOWN")?._count.id ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/articles" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Back to Articles
        </Link>
        <h1 className="font-serif text-2xl font-bold mt-2 line-clamp-2">{article.title}</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricsStatCard label="Total Views" value={totalViews} />
        <MetricsStatCard label="Upvotes" value={upvotes} />
        <MetricsStatCard label="Downvotes" value={downvotes} />
        <MetricsStatCard label="Comments" value={comments.length} />
      </div>

      {/* Geo breakdown */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Views by Location</h2>
        <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geoRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-8">
                    No location data yet. Geo data populates after Vercel deployment.
                  </TableCell>
                </TableRow>
              )}
              {geoRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.country ?? "Unknown"}</TableCell>
                  <TableCell>{row.region ?? "—"}</TableCell>
                  <TableCell className="text-right">{row._count.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Comments</h2>
        <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-8">
                    No comments yet.
                  </TableCell>
                </TableRow>
              )}
              {comments.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium whitespace-nowrap">{c.authorName}</TableCell>
                  <TableCell className="max-w-md">{c.body}</TableCell>
                  <TableCell className="whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
