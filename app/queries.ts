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
      if (query.state.data == undefined) return false;
      return query.state.data.status === "completed" ? false : 1000;
    },
  });
};
