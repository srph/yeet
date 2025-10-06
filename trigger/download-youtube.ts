import { schemaTask } from "@trigger.dev/sdk";
import { Innertube, UniversalCache } from "youtubei.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.AWS_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const downloadYoutubeTask = schemaTask({
  id: "download.youtube",
  schema: z.object({
    videoId: z.string(),
    downloadId: z.string(),
  }),
  run: async (payload) => {
    // https://github.com/LuanRT/YouTube.js/issues/1043#issuecomment-3328154175
    const yt = await Innertube.create({
      lang: "en",
      location: "US",
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      enable_safety_mode: true,
      generate_session_locally: true,
      enable_session_cache: true,
      device_category: "desktop",
      timezone: "America/New_York",
      player_id: "0004de42",
      cache: new UniversalCache(false),
    });

    const videoId = payload.videoId;
    const fileName = `${videoId}.mp4`;
    const key = `${process.env.AWS_BASE_DIRECTORY}/${fileName}`;

    // Download video stream directly using videoId
    const stream = await yt.download(videoId, {
      type: "video+audio",
      quality: "best",
      format: "mp4",
      client: "YTMUSIC",
    });

    // Convert stream to buffer (needed for S3)
    const chunks: Buffer[] = [];
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }

    const buffer = Buffer.concat(chunks);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "video/mp4",
      })
    );

    // Generate temporary download URL
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    return {
      downloadUrl,
      fileName,
    };
  },
  onStart: async ({ payload, ctx }) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: { status: "processing" },
    });
  },
  onSuccess: async ({ payload, output, ctx }) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: {
        status: "complete",
        downloadUrl: output.downloadUrl,
        downloadFileName: output.fileName,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      },
    });
  },
  onFailure: async ({ payload, error, ctx }) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: {
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      },
    });
  },
});
