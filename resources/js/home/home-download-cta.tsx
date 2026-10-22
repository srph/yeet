import { RotateCcwIcon } from "lucide-react";
import { MetalButton } from "@/components/metal-button/metal-button";
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
      <g className="-translate-y-0.5 transition-transform duration-200 ease-out group-enabled:group-hover:translate-y-px motion-reduce:transition-none motion-reduce:group-enabled:group-hover:-translate-y-0.5">
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
  onRetry,
}: {
  status: DownloadMeta["status"];
  onDownload: () => void;
  onRetry: () => void;
}) {
  const isSettled = status === "complete";
  const isDead = status === "failed" || status === "expired";

  return (
    <MetalButton
      type="button"
      disabled={!isSettled && !isDead}
      onClick={isDead ? onRetry : onDownload}
      className="group w-full"
    >
      {isDead ? (
        <RotateCcwIcon className="size-4" aria-hidden="true" />
      ) : (
        <DownloadIcon className="size-4 overflow-visible" />
      )}
      {isDead
        ? status === "expired"
          ? "Yeet it again"
          : "Try again"
        : "Download Now"}
    </MetalButton>
  );
}
