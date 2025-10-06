import { NextResponse } from "next/server";
import { Innertube, UniversalCache } from "youtubei.js";
import { prisma } from "@/prisma/client";
import { downloadYoutubeTask } from "@/trigger/download-youtube";
import { z } from "zod";
import invariant from "tiny-invariant";

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
        youtubeUrl: url,
        status: { not: "failed" },
        expiredAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

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

    const video = await yt.getInfo(videoId);

    const download = await prisma.youtubeDownload.create({
      data: {
        youtubeUrl: url,
        youtubeId: videoId,
        youtubeTitle: video.basic_info.title ?? "",
        youtubeThumbnail: video.basic_info.thumbnail?.at(-1)?.url ?? "",
        status: "queued",
        downloadFileName: null,
        downloadUrl: null,
        reason: null,
      },
    });

    await downloadYoutubeTask.trigger({
      videoId,
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
