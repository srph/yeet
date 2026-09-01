import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button/button";
import type { DownloadMeta } from "../types";
import { HomeDownloadCta } from "./home-download-cta";

/**
 * Everything actionable on the tracking screen: the download CTA and its
 * "Start over" companion, or the retry line once the row is dead.
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
  const isSettled = status === "complete";
  const isDead = status === "failed" || status === "expired";

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isDead ? (
        <motion.div
          key="retry"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="text-[12.5px] leading-[1.4] text-neutral-600"
        >
          {status === "expired"
            ? "That link's gone cold. "
            : "Shit crashed in the kitchen. Maybe "}
          <button
            type="button"
            onClick={onRetry}
            className="text-blue-200 underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          >
            {status === "expired" ? "Yeet it again" : "try again"}
          </button>
          ?
        </motion.div>
      ) : (
        <motion.div
          key="download"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <HomeDownloadCta status={status} onDownload={onDownload} />

          {isSettled ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onDownloadAnother}
              className="mt-1.5 w-full"
            >
              Start over
            </Button>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
