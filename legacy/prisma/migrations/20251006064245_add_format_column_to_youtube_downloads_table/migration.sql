/*
  Warnings:

  - Added the required column `format` to the `youtube_downloads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `youtube_downloads` ADD COLUMN `format` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `youtube_downloads_format_idx` ON `youtube_downloads`(`format`);
