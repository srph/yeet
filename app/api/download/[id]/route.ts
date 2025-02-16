import { NextResponse } from "next/server";
import { TriggerClient } from "@trigger.dev/sdk";
import { prisma } from "@/prisma/client";

const trigger = new TriggerClient({
  id: "yeet",
  apiKey: process.env.TRIGGER_API_KEY || "",
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!process.env.TRIGGER_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

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
