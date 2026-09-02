import { useMutation } from "@tanstack/react-query";
import type { DownloadMeta } from "./types";

// Zod stays off the landing graph (dynamic import below). In Vite that
// import() is a fetch to the dev server at submit time — if the process
// has died (port hop, leftover tab), Chrome throws "Failed to fetch
// dynamically imported module". Warm the module now, while the server is
// still up; the later import() is a cache hit. `import.meta.env.DEV` is
// stripped from the production build, so this does not put Zod on `/`.
if (import.meta.env.DEV) {
  void import("./types");
}

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
  if (response.status === 429) {
    return "Rate limit reached. Try again in a few minutes.";
  }

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

      const { DownloadMetaSchema } = await import("./types");
      return DownloadMetaSchema.parse(await response.json());
    },
  });
};
