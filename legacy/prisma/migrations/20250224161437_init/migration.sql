-- CreateTable
CREATE TABLE `youtube_downloads` (
    `id` VARCHAR(191) NOT NULL,
    `youtubeUrl` VARCHAR(191) NOT NULL,
    `youtubeId` VARCHAR(191) NOT NULL,
    `youtubeTitle` VARCHAR(191) NOT NULL,
    `youtubeThumbnail` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `downloadFileName` VARCHAR(191) NULL,
    `downloadUrl` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `expiredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `youtube_downloads_status_idx`(`status`),
    INDEX `youtube_downloads_youtubeId_idx`(`youtubeId`),
    INDEX `youtube_downloads_createdAt_idx`(`createdAt`),
    INDEX `youtube_downloads_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
