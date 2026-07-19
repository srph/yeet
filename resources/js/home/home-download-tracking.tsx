import {
  ArrowDownToLineIcon,
  FilmIcon,
  LoaderCircleIcon,
  ArrowUpRightIcon,
  MusicIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DownloadMeta } from "../types";
import { HomeDownloadStatus } from "./home-download-status";

/**
 * The post-submit screen: a narrow spec rail against a big thumbnail.
 *
 * Rail rows that are real columns: format, file name, expiry, media duration,
 * and fulfilled_at (shown as "Took"). Resolution, codec and file size were in
 * the design too and are NOT rendered: nothing captures them, and a
 * plausible-looking "1920x1080 · 60fps" that doesn't reflect the actual file
 * is worse than an absent row.
 */

// The open badge is the one piece of source-specific chrome. lucide dropped
// brand glyphs in v1, so the source reads through colour rather than a logo.
const SOURCE_BADGE: Record<DownloadMeta["source"], string> = {
  youtube: "bg-red-700",
  x: "bg-neutral-950",
  facebook: "bg-blue-600",
};

const SOURCE_LABEL: Record<DownloadMeta["source"], string> = {
  youtube: "YouTube",
  x: "X",
  facebook: "Facebook",
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

/** Queue wait + cook — distinct from media Length above. */
const formatElapsed = (createdAt: string, fulfilledAt: string) => {
  const seconds = Math.max(
    0,
    Math.round((new Date(fulfilledAt).getTime() - new Date(createdAt).getTime()) / 1000),
  );

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes < 60) return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

export const HomeDownloadTracking = ({
  meta,
  onRetry,
  onDownload,
  onDownloadAnother,
}: {
  meta: DownloadMeta;
  onRetry: () => void;
  onDownload: () => void;
  onDownloadAnother: () => void;
}) => {
  const { status } = meta;

  const isSettled = status === "complete";
  const isWaiting = status === "queued" || status === "processing";
  const isDead = status === "failed" || status === "expired";

  const duration = meta.duration === null ? null : formatDuration(meta.duration);
  const took =
    meta.fulfilled_at === null
      ? null
      : formatElapsed(meta.created_at, meta.fulfilled_at);

  return (
    // viewport-relative, not 100%: the parent is a centred grid item and so is
    // shrink-to-fit, which a percentage width would resolve against.
    <div className="grid w-[min(1000px,100vw_-_2rem)] grid-cols-1 items-center gap-6 min-[880px]:grid-cols-[274px_1fr] min-[880px]:gap-10">
      {/* ── the rail ── */}
      <section className="min-w-0">
        <HomeDownloadStatus status={status} />

        <h1 className="text-[19px] leading-[1.28] font-semibold tracking-[-0.035em] text-white">
          {meta.source_title}
        </h1>

        <a
          href={meta.source_url}
          target="_blank"
          rel="noreferrer"
          className="group mt-[7px] inline-flex max-w-full items-center gap-1.5 text-[11.5px] tracking-normal text-neutral-600 transition hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
        >
          <span className="truncate">{formatSourceUrl(meta.source_url)}</span>
          <ArrowUpRightIcon className="size-2.5 shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
        </a>

        <dl className="mt-5 border-t border-neutral-800 pt-3.5">
          <Spec label="Format" value={meta.format.toUpperCase()} bright />

          {duration && <Spec label="Length" value={duration} />}

          {took && <Spec label="Took" value={took} />}

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
                <button
                  type="button"
                  disabled={!isSettled}
                  onClick={onDownload}
                  aria-label={isSettled ? "Download Now" : "Processing Download"}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-blue-200 text-[14.5px] font-semibold tracking-[-0.02em] text-blue-950 transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600"
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
                </button>

                {isSettled ? (
                  <button
                    type="button"
                    onClick={onDownloadAnother}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-full border-2 border-neutral-800 bg-transparent text-[14.5px] font-semibold tracking-[-0.02em] text-neutral-400 transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 hover:border-neutral-700 hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                  >
                    Start over
                  </button>
                ) : null}
              </motion.div>
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
          className={`group relative block aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 transition-shadow duration-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 ${
            isSettled
              ? "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(16,185,129,0.34),0_0_90px_-26px_rgba(16,185,129,0.42)]"
              : "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]"
          }`}
        >
          {meta.source_thumbnail ? (
            <img
              src={meta.source_thumbnail}
              alt=""
              className={`size-full object-cover transition-[filter] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
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
                    ? "animate-sweep bg-linear-to-r from-transparent via-blue-200/40 to-transparent"
                    : "animate-sweep-slow bg-linear-to-r from-transparent via-white/[0.14] to-transparent"
                }`}
              />
            </span>
          )}

          {/* Hidden while cooking and when there's no thumbnail — the badge
              would sit on top of the "No preview" panel and promise a source
              that isn't there. */}
          {!isWaiting && meta.source_thumbnail && (
            <>
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_100%_0%,rgba(0,0,0,0.45)_0%,transparent_60%)] opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:opacity-100" />
              <span
                className={`pointer-events-none absolute top-3 right-3 flex h-9 origin-right items-center overflow-hidden rounded-lg ${SOURCE_BADGE[meta.source]}`}
              >
                <span className="grid max-w-0 overflow-hidden text-[14.5px] font-semibold tracking-[-0.02em] text-white transition-[max-width] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:max-w-[12rem]">
                  <span className="invisible [grid-area:1/1] whitespace-nowrap pl-2.5" aria-hidden>
                    Watch on {SOURCE_LABEL[meta.source]}
                  </span>
                  <span className="[grid-area:1/1] translate-y-full whitespace-nowrap pl-2.5 transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0">
                    Watch on {SOURCE_LABEL[meta.source]}
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center text-white">
                  <ArrowUpRightIcon className="size-4" />
                </span>
              </span>
            </>
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
