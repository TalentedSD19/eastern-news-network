-- AlterTable
ALTER TABLE "ArticleView" ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "referrerHost" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- CreateIndex
CREATE INDEX "ArticleView_viewedAt_idx" ON "ArticleView"("viewedAt");

-- CreateIndex
CREATE INDEX "ArticleView_visitorId_idx" ON "ArticleView"("visitorId");
