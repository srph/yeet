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
      return status === "complete" || status === "failed" ? false : 1000;
    },
  });
};
