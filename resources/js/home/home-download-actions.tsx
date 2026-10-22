import { cn } from "@/lib/utils";
import type { DownloadMeta } from "../types";
import { HomeDownloadCta } from "./home-download-cta";

/**
 * Everything actionable on the tracking screen: the download or retry CTA
 * and its "Start over" companion.
 *
 * Split out of the rail because the two layouts put it in different places.
 * On desktop it is the last block of the spec rail; on mobile it is docked to
 * the bottom of the shell, out of the rail's scroll, so the primary action is
 * reachable no matter how far down the spec sheet the reader has got.
 */
export function HomeDownloadActions({
  status,
  onRetry,
  onDownload,
  onDownloadAnother,
}: {
  status: DownloadMeta["status"];
  onRetry: () => void;
  onDownload: () => void;
  onDownloadAnother: () => void;
}) {
  const isDead = status === "failed" || status === "expired";

  return (
    <div>
      <HomeDownloadCta
        status={status}
        onDownload={onDownload}
        onRetry={onRetry}
      />
      <div
        className={cn(
          "mt-1.5 flex h-8 items-center gap-2",
          isDead ? "justify-between" : "justify-center",
        )}
      >
        {isDead ? (
          <p className="text-xs text-neutral-500">
            {status === "expired"
              ? "That link's gone cold."
              : "Shit crashed in the kitchen."}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onDownloadAnother}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-sm font-semibold text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
