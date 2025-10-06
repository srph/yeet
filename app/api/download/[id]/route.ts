import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/download/[id]">
) {
  try {
    const { id } = await ctx.params;

    console.log({ id });

    const download = await prisma.youtubeDownload.findFirstOrThrow({
      where: { id },
    });

    console.log({ id, downloadId: download.id });

    return NextResponse.json(download);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
