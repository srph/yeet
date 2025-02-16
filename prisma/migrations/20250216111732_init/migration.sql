-- CreateTable
CREATE TABLE "YoutubeDownload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "youtubeTitle" TEXT NOT NULL,
    "youtubeThumbnail" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "expiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "YoutubeDownload_status_idx" ON "YoutubeDownload"("status");

-- CreateIndex
CREATE INDEX "YoutubeDownload_youtubeId_idx" ON "YoutubeDownload"("youtubeId");

-- CreateIndex
CREATE INDEX "YoutubeDownload_createdAt_idx" ON "YoutubeDownload"("createdAt");

-- CreateIndex
CREATE INDEX "YoutubeDownload_expiresAt_idx" ON "YoutubeDownload"("expiresAt");
