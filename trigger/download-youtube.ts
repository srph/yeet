import { schemaTask } from "@trigger.dev/sdk/v3";
import ytdl from "@distube/ytdl-core";
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

const downloadYoutubeTask = schemaTask({
  id: "download.youtube",
  schema: z.object({
    url: z.string(),
    downloadId: z.string(),
  }),
  run: async (payload) => {
    // Get video info
    const info = await ytdl.getInfo(payload.url);
    const videoId = info.videoDetails.videoId;
    const key = `yeet/${videoId}.mp4`;

    // Stream to S3
    const videoStream = ytdl(payload.url, {
      quality: "highestvideo",
      filter: "audioandvideo",
    });

    // Convert stream to buffer (needed for S3)
    const chunks: Buffer[] = [];
    for await (const chunk of videoStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Upload to S3
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
    };
  },
  onStart: async (payload) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: { status: "processing" },
    });
  },
  onSuccess: async (payload, output) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: {
        status: "complete",
        downloadUrl: output.downloadUrl,
        expiresAt: new Date(), // One week from now
      },
    });
  },
  onFailure: async (payload, error) => {
    await prisma.youtubeDownload.update({
      where: { id: payload.downloadId },
      data: {
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      },
    });
  },
});

export { downloadYoutubeTask };
