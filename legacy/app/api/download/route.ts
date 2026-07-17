import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { downloadYoutubeTask } from "@/trigger/download-youtube";
import { z } from "zod";
import invariant from "tiny-invariant";
import { createInnertube } from "@/app/yt";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { url, format } = validation.data;

    const videoId = getYoutubeId(url);
    invariant(videoId, "Failed to extract video ID from URL");

    const existing = await prisma.youtubeDownload.findFirst({
      where: {
        youtubeId: videoId,
        format: format,
        status: { not: "failed" },
        expiredAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const yt = await createInnertube();

    const video = await yt.getInfo(videoId);

    const download = await prisma.youtubeDownload.create({
      data: {
        youtubeUrl: url,
        youtubeId: videoId,
        youtubeTitle: video.basic_info.title ?? "",
        youtubeThumbnail: video.basic_info.thumbnail?.at(-1)?.url ?? "",
        format: format,
        status: "queued",
        downloadFileName: null,
        downloadUrl: null,
        reason: null,
      },
    });

    await downloadYoutubeTask.trigger({
      videoId,
      downloadId: download.id,
      format,
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

const RequestSchema = z.object({
  url: z.string().refine(
    (url) => {
      const videoId = getYoutubeId(url);
      return videoId !== null;
    },
    {
      message: "Invalid YouTube URL - must be a valid YouTube link",
    }
  ),
  format: z.enum(["mp3", "mp4"]),
});

const regexes = {
  short: /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  long: /[?&]v=([a-zA-Z0-9_-]{11})/,
  embed: /embed\/([a-zA-Z0-9_-]{11})/,
};

const getYoutubeId = (url: string) => {
  {
    // https://youtu.be/rpC1PohpbaQ
    const match = url.match(regexes.short);
    if (match) return match[1];
  }

  {
    // https://www.youtube.com/watch?v=nIafYz4RB7k
    const match = url.match(regexes.long);
    if (match) return match[1];
  }

  // https://www.youtube.com/embed/VIDEO_ID
  const match = url.match(regexes.embed);
  if (match) return match[1];

  return null;
};
