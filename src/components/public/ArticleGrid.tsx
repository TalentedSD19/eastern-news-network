import { ArticleWithRelations } from "@/types";
import ArticleCard from "./ArticleCard";

export default function ArticleGrid({ articles }: { articles: ArticleWithRelations[] }) {
  if (articles.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-20">No articles yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} priority={index < 3} />
      ))}
    </div>
  );
}
