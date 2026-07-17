import { z } from "zod";

// Snake_case throughout — this is Eloquent's serialization, consumed as-is.
// The schema is a 1:1 mirror of the Download model's JSON, which is the upside
// of having no resource layer: one place to look, not two.
export const DownloadMetaSchema = z.object({
  id: z.string(),

  source: z.enum(["youtube", "x", "facebook"]),
  source_url: z.string(),
  source_id: z.string(),
  source_title: z.string(),
  source_thumbnail: z.string().nullable(), // X posts often have none

  // The old schema omitted `format`, so zod silently stripped it even though
  // the API returned it. Adding it back.
  format: z.enum(["mp3", "mp4"]),

  // "expired" is new. In practice the UI won't see it — dedupe skips expired
  // rows, so a poll can only end at complete/failed — but zod throws on an
  // unlisted value, so it belongs here.
  status: z.enum(["queued", "processing", "complete", "failed", "expired"]),

  download_url: z.string().nullable(), // appended accessor, presigned per-read
  storage_file_name: z.string().nullable(),
  reason: z.string().nullable(),
  expires_at: z.string().nullable(),
  // no expired_at — the column is gone; no storage_key — it's $hidden.
  created_at: z.string(),
  updated_at: z.string(),
});

export type DownloadMeta = z.infer<typeof DownloadMetaSchema>;
