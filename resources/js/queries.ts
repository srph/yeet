import { useQuery } from "@tanstack/react-query";
import { DownloadMeta, DownloadMetaSchema } from "./types";

export const useDownloadMeta = (id?: string) => {
  const queryFn = async (): Promise<DownloadMeta> => {
    const response = await fetch(`/api/download/${id}`);
    if (!response.ok) throw new Error("Failed to fetch status");
    return DownloadMetaSchema.parse(await response.json());
  };

  return useQuery({
    queryKey: ["download", id],
    queryFn,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status == undefined) return false;

      // WAS: `status === "complete" ? false : 1000` — which meant a FAILED
      // download polled at 1 req/sec forever until the tab closed. Both are
      // terminal states; stop on both.
      //
      // "expired" is terminal too. It's meant to be unreachable here (dedupe
      // skips expired rows, so a poll should only ever end at complete or
      // failed), but if one ever does surface it would poll forever — the
      // exact bug above, one status over. Enumerate the terminal set instead.
      const terminal = ["complete", "failed", "expired"];

      return terminal.includes(status) ? false : 1000;
    },
  });
};
