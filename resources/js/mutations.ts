import { useMutation } from "@tanstack/react-query";
import { DownloadMeta, DownloadMetaSchema } from "./types";

// The old hand-written interface duplicated a subset of the download shape and
// had drifted (it claimed youtubeUrl/youtubeThumbnail, but the code only ever
// reads .id). mutationFn already parses through DownloadMetaSchema, so infer
// from the schema and it can't drift again.
export type YeetResponse = DownloadMeta;

export interface YeetPayload {
  url: string;
  format: string;
}

export const useYeetMutation = () => {
  return useMutation<YeetResponse, Error, YeetPayload>({
    mutationFn: async (payload: YeetPayload) => {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to yeet");
      }

      return DownloadMetaSchema.parse(await response.json());
    },
  });
};
