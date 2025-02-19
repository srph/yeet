-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_YoutubeDownload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "youtubeTitle" TEXT NOT NULL,
    "youtubeThumbnail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "downloadUrl" TEXT,
    "reason" TEXT,
    "expiresAt" DATETIME,
    "expiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_YoutubeDownload" ("createdAt", "downloadUrl", "expiredAt", "expiresAt", "id", "reason", "status", "updatedAt", "youtubeId", "youtubeThumbnail", "youtubeTitle", "youtubeUrl") SELECT "createdAt", "downloadUrl", "expiredAt", "expiresAt", "id", "reason", "status", "updatedAt", "youtubeId", "youtubeThumbnail", "youtubeTitle", "youtubeUrl" FROM "YoutubeDownload";
DROP TABLE "YoutubeDownload";
ALTER TABLE "new_YoutubeDownload" RENAME TO "YoutubeDownload";
CREATE INDEX "YoutubeDownload_status_idx" ON "YoutubeDownload"("status");
CREATE INDEX "YoutubeDownload_youtubeId_idx" ON "YoutubeDownload"("youtubeId");
CREATE INDEX "YoutubeDownload_createdAt_idx" ON "YoutubeDownload"("createdAt");
CREATE INDEX "YoutubeDownload_expiresAt_idx" ON "YoutubeDownload"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
