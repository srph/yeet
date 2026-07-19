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

const FALLBACK_YEET_ERROR = "Yikes, server hiccup. Maybe try again?";

/** Laravel 422 shape: `{ errors: { field: [msg] } }`. Prefer `url`, else first field. */
async function yeetErrorMessage(response: Response): Promise<string> {
  if (response.status === 422) {
    try {
      const body = await response.json();
      const fieldErrors = body?.errors;

      if (fieldErrors && typeof fieldErrors === "object") {
        const urlError = fieldErrors.url?.[0];
        if (typeof urlError === "string") return urlError;

        for (const messages of Object.values(fieldErrors)) {
          if (Array.isArray(messages) && typeof messages[0] === "string") {
            return messages[0];
          }
        }
      }

      if (typeof body?.message === "string" && body.message) {
        return body.message;
      }
    } catch {
      // fall through to generic copy
    }
  }

  return FALLBACK_YEET_ERROR;
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
        throw new Error(await yeetErrorMessage(response));
      }

      return DownloadMetaSchema.parse(await response.json());
    },
  });
};
