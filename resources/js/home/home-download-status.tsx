import { DecryptedText } from "@/components/decrypted-text";
import { DownloadMeta } from "../types";

type Status = DownloadMeta["status"];

const STATUS_LABEL: Record<Status, string> = {
  queued: "In line",
  probing: "Grabbing Metadata",
  processing: "Cooking",
  complete: "Ready",
  failed: "Burnt",
  expired: "Gone",
};

const STATUS_TONE: Record<Status, { text: string; dot: string }> = {
  queued: {
    text: "text-neutral-500",
    dot: "bg-neutral-600 animate-blink-slow",
  },
  probing: {
    text: "text-blue-200",
    dot: "bg-blue-200 shadow-[0_0_8px_var(--color-blue-200)] animate-blink",
  },
  processing: {
    text: "text-blue-200",
    dot: "bg-blue-200 shadow-[0_0_8px_var(--color-blue-200)] animate-blink",
  },
  complete: {
    text: "text-emerald-500",
    dot: "bg-emerald-500 shadow-[0_0_8px_var(--color-emerald-500)]",
  },
  failed: {
    text: "text-red-400",
    dot: "bg-red-700 shadow-[0_0_8px_var(--color-red-700)]",
  },
  expired: { text: "text-neutral-500", dot: "bg-neutral-600" },
};

export const HomeDownloadStatus = ({ status }: { status: Status }) => {
  const tone = STATUS_TONE[status];

  return (
    <div
      className={`mb-4 inline-flex items-center gap-2 font-mono text-[11.5px] font-bold tracking-[0.17em] uppercase ${tone.text}`}
    >
      <span className={`size-[5px] rounded-full ${tone.dot}`} />
      {/* keyed so the scramble replays on every transition */}
      <DecryptedText key={status} text={STATUS_LABEL[status]} speed={45} />
    </div>
  );
};
