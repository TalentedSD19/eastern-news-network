-- AlterTable
ALTER TABLE "ArticleView" ADD COLUMN     "activeSeconds" INTEGER,
ADD COLUMN     "maxScrollPct" INTEGER;

-- CreateTable
CREATE TABLE "ShareClick" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareClick_articleId_idx" ON "ShareClick"("articleId");

-- CreateIndex
CREATE INDEX "ShareClick_createdAt_idx" ON "ShareClick"("createdAt");

-- AddForeignKey
ALTER TABLE "ShareClick" ADD CONSTRAINT "ShareClick_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
