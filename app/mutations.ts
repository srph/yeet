import { useMutation } from "@tanstack/react-query";

export interface YeetResponse {
  id: string; // The job ID
  status: string;
  youtubeUrl: string;
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

      return response.json();
    },
  });
};
