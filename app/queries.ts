import { useQuery } from "@tanstack/react-query";

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
