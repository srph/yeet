import {
  ArrowDownToLineIcon,
  FilmIcon,
  LoaderCircleIcon,
  MoveUpRightIcon,
  MusicIcon,
  PlayIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DecryptedText } from "./decrypted-text";
import { DownloadMeta } from "./types";

type Status = DownloadMeta["status"];

/**
 * The post-submit screen: a narrow spec rail against a big thumbnail.
 *
 * Only three of the rail's rows are real columns — format, file name and
 * expiry — plus duration, which the API started persisting for this screen.
 * Resolution, codec and file size were in the design too and are NOT rendered:
 * nothing captures them, and a plausible-looking "1920x1080 · 60fps" that
 * doesn't reflect the actual file is worse than an absent row.
 */

const STATUS_LABEL: Record<Status, string> = {
  queued: "In line",
  processing: "Cooking",
  complete: "Served",
  failed: "Burnt",
  expired: "Gone",
};

const STATUS_TONE: Record<Status, { text: string; dot: string }> = {
  queued: {
    text: "text-neutral-500",
    dot: "bg-neutral-600 animate-blink-slow",
  },
  processing: {
    text: "text-yellow-500",
    dot: "bg-yellow-500 shadow-[0_0_8px_var(--color-yellow-500)] animate-blink",
  },
  complete: {
    text: "text-yellow-500",
    dot: "bg-yellow-500 shadow-[0_0_8px_var(--color-yellow-500)]",
  },
  failed: {
    text: "text-red-400",
    dot: "bg-red-700 shadow-[0_0_8px_var(--color-red-700)]",
  },
  expired: { text: "text-neutral-500", dot: "bg-neutral-600" },
};

// The play badge is the one piece of source-specific chrome. lucide dropped
// brand glyphs in v1, so the source reads through colour rather than a logo.
const SOURCE_BADGE: Record<DownloadMeta["source"], string> = {
  youtube: "bg-red-700",
  x: "bg-neutral-950",
  facebook: "bg-blue-600",
};

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
};

/** youtube.com/watch?v=x, x.com/user/status/1 — whatever the source happens to be. */
const formatSourceUrl = (url: string) => {
  try {
    const { hostname, pathname, search } = new URL(url);

    return `${hostname.replace(/^www\./, "")}${pathname}${search}`;
  } catch {
    return url; // not our job to validate; the server already accepted it
  }
};

/**
 * Middle-truncate so the extension survives: the tail is the informative part
 * ("...mp3" vs "...mp4"), and source ids are long enough that a plain clip
 * would eat it. The "..." doubles as the separator, so there's no second dot.
 */
const truncateFileName = (name: string, head = 8) => {
  const dot = name.lastIndexOf(".");

  // Dotfile or no extension at all — nothing worth preserving on the right.
  if (dot <= 0) return name.length > head + 3 ? `${name.slice(0, head)}...` : name;

  const base = name.slice(0, dot);
  const ext = name.slice(dot + 1);

  return base.length > head ? `${base.slice(0, head)}...${ext}` : name;
};

const formatExpiry = (iso: string) => {
  const remaining = new Date(iso).getTime() - Date.now();
  if (remaining <= 0) return "any moment now";

  const hours = Math.round(remaining / 3_600_000);
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;

  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
};

const Spec = ({
  label,
  value,
  bright,
  title,
}: {
  label: string;
  value: string;
  bright?: boolean;
  /** The untruncated value, surfaced on hover. */
  title?: string;
}) => (
  <div className="flex items-baseline gap-2 py-[5.5px] text-xs">
    <dt className="whitespace-nowrap text-neutral-600">{label}</dt>
    <span className="h-px flex-1 -translate-y-[3px] bg-[repeating-linear-gradient(90deg,var(--color-neutral-800)_0_2px,transparent_2px_5px)]" />
    <dd
      title={title}
      className={`whitespace-nowrap tabular-nums ${bright ? "text-white" : "text-neutral-400"}`}
    >
      {value}
    </dd>
  </div>
);

/** For values too long to sit on a leader row without truncating away the end. */
const StackedSpec = ({ label, value, bright }: { label: string; value: string; bright?: boolean }) => (
  <div className="pt-2 pb-[5.5px] text-xs">
    <dt className="mb-1 text-neutral-600">{label}</dt>
    <dd
      className={`leading-[1.35] break-all ${bright ? "text-white" : "text-neutral-400"}`}
    >
      {value}
    </dd>
  </div>
);

export const DownloadStatus = ({
  meta,
  onRetry,
  onDownload,
}: {
  meta: DownloadMeta;
  onRetry: () => void;
  onDownload: () => void;
}) => {
  const { status } = meta;

  const isSettled = status === "complete";
  const isWaiting = status === "queued" || status === "processing";
  const isDead = status === "failed" || status === "expired";

  const tone = STATUS_TONE[status];
  const duration = meta.duration === null ? null : formatDuration(meta.duration);

  return (
    // viewport-relative, not 100%: the parent is a centred grid item and so is
    // shrink-to-fit, which a percentage width would resolve against.
    <div className="grid w-[min(1000px,100vw_-_2rem)] grid-cols-1 items-center gap-6 min-[880px]:grid-cols-[274px_1fr] min-[880px]:gap-10">
      {/* ── the rail ── */}
      <section className="min-w-0">
        <div
          className={`mb-4 inline-flex items-center gap-2 text-[11.5px] font-bold tracking-[0.17em] uppercase ${tone.text}`}
        >
          <span className={`size-[5px] rounded-full ${tone.dot}`} />
          {/* keyed so the scramble replays on every transition */}
          <DecryptedText key={status} text={STATUS_LABEL[status]} speed={45} />
        </div>

        <h1 className="text-[19px] leading-[1.28] font-semibold tracking-[-0.035em] text-white">
          {meta.source_title}
        </h1>

        <a
          href={meta.source_url}
          target="_blank"
          rel="noreferrer"
          className="group mt-[7px] inline-flex max-w-full items-center gap-1.5 text-[11.5px] tracking-normal text-neutral-600 transition hover:text-yellow-500"
        >
          <span className="truncate">{formatSourceUrl(meta.source_url)}</span>
          <MoveUpRightIcon className="size-2.5 shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
        </a>

        <dl className="mt-5 border-t border-neutral-800 pt-3.5">
          <Spec label="Format" value={meta.format.toUpperCase()} bright />

          {duration && <Spec label="Length" value={duration} />}

          {meta.storage_file_name && (
            <Spec
              label="File name"
              value={truncateFileName(meta.storage_file_name)}
              title={meta.storage_file_name}
              bright={isSettled}
            />
          )}

          {status === "failed" ? (
            // Stacked, not a leader row: an exception message is long and
            // arbitrary, and truncating it hides the only useful part.
            <StackedSpec label="Reason" value={meta.reason ?? "Unknown error"} />
          ) : status === "expired" ? (
            <Spec label="Expired" value="link is gone" />
          ) : meta.expires_at ? (
            <Spec label="Expires" value={formatExpiry(meta.expires_at)} />
          ) : (
            <Spec label="Expires" value="7 days once ready" />
          )}
        </dl>

        <div className="mt-[22px]">
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
                  className="text-yellow-500 underline underline-offset-[3px]"
                >
                  {status === "expired" ? "Yeet it again" : "try again"}
                </button>
                ?
              </motion.div>
            ) : (
              <motion.button
                key="download"
                type="button"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                disabled={!isSettled}
                onClick={onDownload}
                aria-label={isSettled ? "Download Now" : "Processing Download"}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-white text-[14.5px] font-semibold tracking-[-0.02em] text-black transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600"
              >
                {isSettled ? (
                  <>
                    <ArrowDownToLineIcon className="size-[15px]" />
                    Download Now
                  </>
                ) : (
                  <>
                    <LoaderCircleIcon className="size-[15px] animate-spin" />
                    {status === "queued" ? "Waiting" : "Processing"}
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── the plate ── */}
      <section className="order-first w-full min-[880px]:order-none">
        <a
          href={meta.source_url}
          target="_blank"
          rel="noreferrer"
          className={`relative block aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 transition-shadow duration-700 ${
            isSettled
              ? "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(234,179,8,0.34),0_0_90px_-26px_rgba(234,179,8,0.42)]"
              : "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]"
          }`}
        >
          {meta.source_thumbnail ? (
            <img
              src={meta.source_thumbnail}
              alt=""
              className={`size-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                isWaiting ? "brightness-50 grayscale-[0.85]" : ""
              } ${isDead ? "brightness-[0.3] grayscale" : ""} ${
                isSettled ? "scale-[1.02]" : ""
              }`}
            />
          ) : (
            // X posts frequently have no thumbnail, and an mp3 has no video to
            // show either — so this is a normal state, not a failure.
            <div className="flex size-full flex-col items-center justify-center gap-2.5 text-neutral-600">
              {meta.format === "mp3" ? (
                <MusicIcon className="size-7" />
              ) : (
                <FilmIcon className="size-7" />
              )}
              <span className="text-[11.5px] font-medium tracking-normal">
                No preview
              </span>
            </div>
          )}

          {/* scanlines while it cooks */}
          {status === "processing" && (
            <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(234,179,8,0.055)_0_1px,transparent_1px_4px)]" />
          )}

          {/* the shimmer — the only motion on this screen */}
          {isWaiting && (
            <span className="pointer-events-none absolute inset-0 overflow-hidden">
              <span
                className={`absolute inset-y-0 w-[38%] ${
                  status === "processing"
                    ? "animate-sweep bg-linear-to-r from-transparent via-yellow-500/40 to-transparent"
                    : "animate-sweep-slow bg-linear-to-r from-transparent via-white/[0.14] to-transparent"
                }`}
              />
            </span>
          )}

          {/* Hidden while cooking (nothing to play yet) and when there's no
              thumbnail — the badge would sit on top of the "No preview" panel
              and promise a preview that isn't there. */}
          {!isWaiting && meta.source_thumbnail && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span
                className={`grid h-[52px] w-[76px] place-items-center rounded-xl shadow-[0_10px_34px_rgba(0,0,0,0.6)] ${SOURCE_BADGE[meta.source]}`}
              >
                <PlayIcon className="size-7 fill-white text-white" />
              </span>
            </span>
          )}

          {duration && (
            <span className="absolute right-3 bottom-3 rounded-md bg-neutral-950/70 px-2.5 py-1.5 text-[11.5px] font-semibold tracking-normal tabular-nums backdrop-blur-md">
              {duration}
            </span>
          )}
        </a>
      </section>
    </div>
  );
};
