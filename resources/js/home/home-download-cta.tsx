import { ArrowDownToLineIcon, LoaderCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DownloadMeta } from "../types";

export function HomeDownloadCta({
  status,
  onDownload,
}: {
  status: DownloadMeta["status"];
  onDownload: () => void;
}) {
  const isSettled = status === "complete";

  return (
    <button
      type="button"
      disabled={!isSettled}
      onClick={onDownload}
      aria-label={isSettled ? "Download Now" : "Processing Download"}
      className="relative h-11 w-full overflow-hidden rounded-full bg-blue-200 text-[14.5px] font-semibold tracking-[-0.02em] text-blue-950 transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600"
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={isSettled ? "ready" : status === "queued" ? "waiting" : "processing"}
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center gap-2.5"
        >
          {isSettled ? (
            <>
              <ArrowDownToLineIcon className="size-[15px]" />
              Download Now
            </>
          ) : status === "queued" ? (
            "Waiting"
          ) : (
            <>
              <LoaderCircleIcon className="size-[15px] animate-[spin_0.5s_linear_infinite]" />
              Processing
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
