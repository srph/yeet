import { z } from "zod";

export const DownloadMetaSchema = z.object({
  id: z.string(),
  youtubeUrl: z.string(),
  youtubeId: z.string(),
  youtubeTitle: z.string(),
  youtubeThumbnail: z.string(),
  status: z.string().default("pending"),
  downloadUrl: z.string().nullable(),
  reason: z.string().nullable(),
  expiresAt: z.string().nullable(),
  expiredAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DownloadMeta = z.infer<typeof DownloadMetaSchema>;
