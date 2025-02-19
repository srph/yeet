import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// const DownloadMetaSchema = z.object({

// })

export const useDownloadMeta = (id?: string) => {
  return useQuery({
    queryKey: ["download", id],
    queryFn: async () => {
      const response = await fetch(`/api/download/${id}`);
      if (!response.ok) throw new Error("Failed to fetch status");
      return response.json();
    },
    enabled: !!id,
    refetchInterval: (data) => (data?.status === "completed" ? false : 1000), // Poll every second until complete
  });
};
