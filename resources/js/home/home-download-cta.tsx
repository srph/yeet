import { LoaderCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DownloadMeta } from "../types";

/** Lucide arrow-down-to-line, split so the arrow can ease toward the tray. */
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <g className="-translate-y-[2px] transition-transform duration-200 ease-out group-hover:translate-y-px">
        <path d="M12 17V3" />
        <path d="m6 11 6 6 6-6" />
      </g>
      <path d="M19 21H5" />
    </svg>
  );
}

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
      className="group relative h-11 w-full overflow-hidden rounded-full bg-blue-200 text-[14.5px] font-semibold tracking-[-0.02em] text-blue-950 transition-colors hover:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:cursor-not-allowed disabled:border disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600 disabled:hover:bg-transparent"
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
              <DownloadIcon className="size-[15px] overflow-visible" />
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
