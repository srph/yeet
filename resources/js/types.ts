import { z } from "zod";
import { SOURCE_IDS } from "./sources";

// Snake_case throughout — this is Eloquent's serialization, consumed as-is.
// The schema is a 1:1 mirror of the Download model's JSON, which is the upside
// of having no resource layer: one place to look, not two.
export const DownloadMetaSchema = z.object({
  id: z.string(),

  source: z.enum(SOURCE_IDS),
  source_url: z.string(),
  source_id: z.string(),
  source_title: z.string(),
  source_thumbnail: z.string().nullable(), // X posts often have none

  // Whole seconds, from yt-dlp's probe. Nullable: live streams and some X
  // posts have no duration, and rows created before the column existed.
  duration: z.number().nullable(),

  // The old schema omitted `format`, so zod silently stripped it even though
  // the API returned it. Adding it back.
  format: z.enum(["mp3", "mp4"]),

  // "probing" = yt-dlp metadata (title/thumb/duration). "expired" is rarely
  // seen here — dedupe skips expired rows — but zod throws on unlisted values.
  status: z.enum([
    "queued",
    "probing",
    "processing",
    "complete",
    "failed",
    "expired",
  ]),

  download_url: z.string().nullable(), // appended accessor, presigned per-read
  storage_file_name: z.string().nullable(),
  // Exact byte count of the stored file, stat'd by the job before upload.
  // Null while the file doesn't exist yet, on rows that predate the column,
  // and if stat failed — every one of those means "we don't know", which the
  // rail renders by omitting the row rather than guessing.
  storage_file_size: z.number().nullable(),
  reason: z.string().nullable(),
  expires_at: z.string().nullable(),
  // Set when the job settles (complete or failed). Null while queued/
  // probing/processing, and for rows created before the column existed.
  fulfilled_at: z.string().nullable(),
  // no expired_at — the column is gone; no storage_key — it's $hidden.
  created_at: z.string(),
  updated_at: z.string(),
});

export type DownloadMeta = z.infer<typeof DownloadMetaSchema>;
