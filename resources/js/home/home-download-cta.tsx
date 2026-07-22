import { LoaderCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button/button";
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
    <Button
      type="button"
      disabled={!isSettled}
      onClick={onDownload}
      aria-label={isSettled ? "Download Now" : "Processing Download"}
      className="group relative w-full overflow-hidden"
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={isSettled ? "ready" : status === "queued" ? "waiting" : "busy"}
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
              {status === "probing" ? "Grabbing metadata" : "Processing"}
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
