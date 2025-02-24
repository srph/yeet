import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import { prisma } from "@/prisma/client";
import { tasks } from "@trigger.dev/sdk/v3";
import { downloadYoutubeTask } from "@/trigger/download-youtube";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const existing = await prisma.youtubeDownload.findFirst({
      where: {
        youtubeUrl: url,
        status: { not: "failed" },
        expiredAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const info = await ytdl.getInfo(url);

    const download = await prisma.youtubeDownload.create({
      data: {
        youtubeUrl: url,
        youtubeId: info.videoDetails.videoId,
        youtubeTitle: info.videoDetails.title,
        youtubeThumbnail: info.videoDetails.thumbnails.at(-1)?.url ?? "",
        status: "queued",
        downloadUrl: null,
        reason: null,
      },
    });

    await tasks.trigger<typeof downloadYoutubeTask>("download.youtube", {
      url,
      downloadId: download.id,
    });

    return NextResponse.json(download);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
