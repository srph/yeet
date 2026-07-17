import { useMutation } from "@tanstack/react-query";
import { DownloadMetaSchema } from "./types";

export interface YeetResponse {
  id: string; // The job ID
  status: string;
  youtubeUrl: string;
  youtubeThumbnail: string;
}

export interface YeetPayload {
  url: string;
  format: string;
}

export const useYeetMutation = () => {
  return useMutation<YeetResponse, Error, YeetPayload>({
    mutationFn: async (payload: YeetPayload) => {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to yeet");
      }

      return DownloadMetaSchema.parse(await response.json());
    },
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
