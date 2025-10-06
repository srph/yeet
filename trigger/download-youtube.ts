import { schemaTask } from "@trigger.dev/sdk";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/prisma/client";
import { z } from "zod";
import { env } from "@/app/env.server";
import { createInnertube } from "@/app/yt";

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const downloadYoutubeTask = schemaTask({
  id: "download.youtube",
  schema: z.object({
    videoId: z.string(),
    downloadId: z.string(),
    format: z.enum(["mp3", "mp4"]),
  }),
  run: async (payload) => {
    const yt = await createInnertube();

    const fileName = `${payload.videoId}.${payload.format}`;
    const key = `${env.AWS_BASE_DIRECTORY}/${fileName}`;

    // Download video stream directly using videoId
    const stream = await yt.download(payload.videoId, {
      type: payload.format === "mp3" ? "audio" : "video+audio",
      quality: payload.format === "mp3" ? "bestefficiency" : "best",
      format: payload.format,
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
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: payload.format === "mp3" ? "audio/mpeg" : "video/mp4",
      })
    );

    // Generate temporary download URL
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
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
      where: {
        id: payload.downloadId,
        format: payload.format,
      },
      data: { status: "processing" },
    });
  },
  onSuccess: async ({ payload, output, ctx }) => {
    await prisma.youtubeDownload.update({
      where: {
        id: payload.downloadId,
        format: payload.format,
      },
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
      where: {
        id: payload.downloadId,
        format: payload.format,
      },
      data: {
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      },
    });
  },
});
