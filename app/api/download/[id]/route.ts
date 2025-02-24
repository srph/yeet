import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const download = await prisma.youtubeDownload.findFirstOrThrow({
      where: { id },
    });

    return NextResponse.json(download);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
