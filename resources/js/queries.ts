import { useQuery } from "@tanstack/react-query";
import { DownloadMeta, DownloadMetaSchema } from "./types";

/**
 * Where a row stops moving.
 *
 * "complete" and "failed" are the two the job actually lands on. "expired" is
 * meant to be unreachable from a poll — dedupe skips expired rows — but it is
 * terminal too, and an unenumerated terminal status polls forever: that was
 * the original bug here, when this read `status === "complete" ? false : 1000`
 * and a failed download sat at 1 req/sec until the tab closed. Enumerate the
 * whole set rather than special-casing the happy path.
 */
const TERMINAL = ["complete", "failed", "expired"];

const isTerminal = (status: DownloadMeta["status"] | undefined) =>
  status !== undefined && TERMINAL.includes(status);

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

    // A settled row is immutable, and saying so is what keeps the inline
    // players from restarting when you switch tabs: download_url is presigned
    // *per serialization*, so any refetch hands the player a different string
    // for the same object, Vidstack sees a new src and reloads the source from
    // zero. A finite staleTime would only narrow the window that fires in —
    // and an intermittent reset is worse than a reliable one. "static" is the
    // value that closes it, and it closes reconnect and remount along with
    // focus, since all three go through the same shouldFetchOn check.
    //
    // Live rows stay stale-on-arrival: the interval below is what drives them,
    // and a focus refetch there is a free head start on the next tick.
    //
    // Neither case touches the two fetches that matter: the interval poll runs
    // unconditionally, and the explicit refetch() behind home.tsx's expired-
    // link recovery bypasses staleness entirely.
    staleTime: (query) => (isTerminal(query.state.data?.status) ? "static" : 0),

    refetchInterval: (query) => {
      const status = query.state.data?.status;

      // No data yet — in flight, or errored out. Polling an error at 1/sec is
      // the same runaway the TERMINAL note above describes, one state over.
      if (status === undefined) return false;

      return isTerminal(status) ? false : 1000;
    },
  });
};
