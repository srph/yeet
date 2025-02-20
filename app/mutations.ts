import { useMutation } from "@tanstack/react-query";
import { DownloadMetaSchema } from "./types";
export interface YeetResponse {
  id: string; // The job ID
  status: string;
  youtubeUrl: string;
  youtubeThumbnail: string;
}

export const useYeetMutation = () => {
  return useMutation<YeetResponse, Error, string>({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to yeet");
      }

      return DownloadMetaSchema.parse(await response.json());
    },
  });
};
