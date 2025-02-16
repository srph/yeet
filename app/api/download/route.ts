import { NextResponse } from "next/server";
import { TriggerClient } from "@trigger.dev/sdk";
import ytdl from "@distube/ytdl-core";
import { prisma } from "@/prisma/client";

const trigger = new TriggerClient({
  id: "yeet",
  apiKey: process.env.TRIGGER_API_KEY || "",
});

export async function POST(req: Request) {
  if (!process.env.TRIGGER_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { url } = await req.json();

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const info = await ytdl.getInfo(url);

    const download = await prisma.youtubeDownload.create({
      data: {
        youtubeUrl: url,
        youtubeId: info.videoDetails.videoId,
        youtubeTitle: info.videoDetails.title,
        youtubeThumbnail: info.videoDetails.thumbnail,
        status: "pending",
      },
    });

    await trigger.sendEvent({
      name: "youtube.download.requested",
      payload: { url, downloadId: download.id },
    });

    return NextResponse.json(download);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
