import { Job, TriggerClient } from "@trigger.dev/sdk";
import ytdl from "@distube/ytdl-core";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const trigger = new TriggerClient({
  id: "yeet",
  apiKey: process.env.TRIGGER_API_KEY!,
});

new Job(trigger, {
  id: "youtube-download",
  name: "Download YouTube Video",
  version: "1.0.0",
  trigger: trigger.event({
    name: "youtube.download.requested",
  }),
  run: async (payload, io) => {
    const { url } = payload;

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoId = info.videoDetails.videoId;
    const key = `videos/${videoId}.mp4`;

    // Stream to S3
    const videoStream = ytdl(url, {
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
      success: true,
      downloadUrl,
      videoDetails: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0].url,
      },
    };
  },
});
