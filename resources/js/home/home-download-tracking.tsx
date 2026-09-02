import {
  lazy,
  Suspense,
  useEffect,
  type ReactNode,
} from "react";
import {
  FilmIcon,
  ArrowUpRightIcon,
  MusicIcon,
} from "lucide-react";
import type { DownloadMeta } from "../types";
import { DownloadStatus } from "@/components/download-status/download-status";
import { SourceIcon } from "@/components/source-icon/source-icon";
import { formatFileSize } from "@/lib/fs";
import { SOURCES } from "@/sources";
import { HomeDownloadActions } from "./home-download-actions";

// Vidstack is ~75 KiB compressed and unused on the landing page. Keep it
// out of the initial graph; prefetch the matching player once tracking
// mounts so the chunk is usually warm by the time download_url exists.
const HomeDownloadVideoPlayer = lazy(() =>
  import("./home-download-video-player").then((module) => ({
    default: module.HomeDownloadVideoPlayer,
  })),
);

const HomeDownloadAudioPlayer = lazy(() =>
  import("./home-download-audio-player").then((module) => ({
    default: module.HomeDownloadAudioPlayer,
  })),
);

/**
 * The post-submit screen: a narrow spec rail against a big thumbnail.
 *
 * Rail rows that are real columns: format, file name, expiry, media duration,
 * storage_file_size, and fulfilled_at (shown as "Took"). storage_file_size
 * joined that list once the job started persisting the filesize() it had
 * always computed and thrown away — an exact stat of the uploaded file, not an
 * estimate, which is the only reason it earns a row at all.
 *
 * Resolution and codec were in the design too and are still NOT rendered:
 * nothing captures them, and a plausible-looking "1920x1080 · 60fps" that
 * doesn't reflect the actual file is worse than an absent row.
 */

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
  uppercase = true,
}: {
  label: string;
  value: ReactNode;
  bright?: boolean;
  /** The untruncated value, surfaced on hover. */
  title?: string;
  /** Filenames are case-sensitive — pass false to keep the value as typed. */
  uppercase?: boolean;
}) => (
  <div className="flex items-baseline gap-2 py-[5.5px] text-xs">
    <dt className="font-mono whitespace-nowrap uppercase tracking-wide text-neutral-600">
      {label}
    </dt>
    <span className="h-px flex-1 -translate-y-[3px] bg-[repeating-linear-gradient(90deg,var(--color-neutral-800)_0_2px,transparent_2px_5px)]" />
    <dd
      title={title}
      className={`whitespace-nowrap font-mono tracking-wide tabular-nums ${uppercase ? "uppercase" : "normal-case"} ${bright ? "text-white" : "text-neutral-400"}`}
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

/** Holds the plate's footprint while the player chunk loads. */
function PlayerFallback({
  format,
  thumbnail,
}: {
  format: "mp3" | "mp4";
  thumbnail: string | null;
}) {
  if (format === "mp3") {
    return (
      <div className="flex w-full flex-col" aria-hidden>
        <div className="relative aspect-square w-53 max-w-full self-center overflow-hidden rounded-xl bg-neutral-800 shadow-[0_42px_80px_-32px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05)]">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="size-full object-cover" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(191,219,254,0.34),0_0_90px_-26px_rgba(191,219,254,0.42)]"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="size-full object-cover" />
      ) : null}
    </div>
  );
}

export const HomeDownloadTracking = ({
  meta,
  onRetry,
  onDownload,
  onDownloadAnother,
  onSourceError,
}: {
  meta: DownloadMeta;
  onRetry: () => void;
  onDownload: () => void;
  onDownloadAnother: () => void;
  /**
   * download_url is presigned for an hour and minted per serialization, so a
   * tab left open past that fails its next range request mid-seek. Refetching
   * the row mints a fresh link.
   */
  onSourceError?: () => void;
}) => {
  const { status } = meta;

  const isSettled = status === "complete";
  const isWaiting =
    status === "queued" || status === "probing" || status === "processing";
  const isDead = status === "failed" || status === "expired";
  const isActive = status === "probing" || status === "processing";

  // Playable, not merely settled: prune clears storage_key, which nulls
  // download_url while status stays "complete".
  const playableUrl = isSettled ? meta.download_url : null;

  useEffect(() => {
    if (meta.format === "mp4") {
      void import("./home-download-video-player");
    } else {
      void import("./home-download-audio-player");
    }
  }, [meta.format]);

  const duration = meta.duration === null ? null : formatDuration(meta.duration);
  const took =
    meta.fulfilled_at === null
      ? null
      : formatElapsed(meta.created_at, meta.fulfilled_at);

  // Gated on isSettled, not just on the value: the number describes a file in
  // the bucket, so it has no business appearing next to a failed row or an
  // expired tombstone whose object prune already deleted.
  const size =
    isSettled && meta.storage_file_size !== null
      ? formatFileSize(meta.storage_file_size)
      : null;

  return (
    // viewport-relative, not 100%: the parent is a centred grid item and so is
    // shrink-to-fit, which a percentage width would resolve against.
    <div className="grid w-[min(1000px,100vw_-_2rem)] grid-cols-1 items-start gap-6 min-[880px]:grid-cols-[274px_1fr] min-[880px]:gap-10">
      {/* ── the rail ── */}
      <section className="min-w-0">
        <DownloadStatus status={status} scramble className="mb-2" />

        <h1 className="text-xl leading-[1.28] font-semibold tracking-[-0.035em] text-white">
          {meta.source_title}
        </h1>

        <dl className="mt-4">
          <Spec
            label="Source"
            value={
              <a
                href={meta.source_url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex max-w-full items-center gap-1.5 transition hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
              >
                <SourceIcon source={meta.source} className="size-3 shrink-0" />
                <span className="truncate">{SOURCES[meta.source].label}</span>
                <ArrowUpRightIcon className="size-2.5 shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
              </a>
            }
          />

          <Spec label="Format" value={meta.format.toUpperCase()} bright />

          {duration && <Spec label="Length" value={duration} />}

          {took && <Spec label="Took" value={took} />}

          {size && <Spec label="File size" value={size} bright />}

          {meta.storage_file_name && (
            <Spec
              label="File name"
              value={truncateFileName(meta.storage_file_name)}
              title={meta.storage_file_name}
              bright={isSettled}
              uppercase={false}
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

        {/* Desktop only. On mobile this same block is docked to the bottom of
            the viewport by Home, where it sits outside the scrolling page. */}
        <div className="mt-5.5 hidden min-[880px]:block">
          <HomeDownloadActions
            status={status}
            onRetry={onRetry}
            onDownload={onDownload}
            onDownloadAnother={onDownloadAnother}
          />
        </div>
      </section>

      {/* ── the plate ── */}
      <section className="order-first w-full min-[880px]:order-none">
        {playableUrl ? (
          <Suspense
            fallback={
              <PlayerFallback
                format={meta.format}
                thumbnail={meta.source_thumbnail}
              />
            }
          >
            {meta.format === "mp4" ? (
              <HomeDownloadVideoPlayer
                meta={meta}
                src={playableUrl}
                onSourceError={onSourceError}
              />
            ) : (
              <HomeDownloadAudioPlayer
                meta={meta}
                src={playableUrl}
                onSourceError={onSourceError}
              />
            )}
          </Suspense>
        ) : (
          <a
            href={meta.source_url}
            target="_blank"
            rel="noreferrer"
            className={`group relative block aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 transition-shadow duration-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 ${
              isSettled
                ? "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(191,219,254,0.34),0_0_90px_-26px_rgba(191,219,254,0.42)]"
                : "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]"
            }`}
          >
            {meta.source_thumbnail ? (
              <img
                src={meta.source_thumbnail}
                alt=""
                className={`size-full object-cover transition-[filter] duration-700 ease-swoop ${
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

            {/* scanlines while probe/cook is actively running */}
            {isActive && (
              <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(234,179,8,0.055)_0_1px,transparent_1px_4px)]" />
            )}

            {/* the shimmer — the only motion on this screen */}
            {isWaiting && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden">
                <span
                  className={`absolute inset-y-0 w-[38%] ${
                    isActive
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
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_100%_0%,rgba(0,0,0,0.45)_0%,transparent_60%)] opacity-0 transition-opacity duration-300 ease-swoop group-hover:opacity-100" />
                <span
                  className={`pointer-events-none absolute top-3 right-3 flex h-9 origin-right items-center overflow-hidden rounded-lg ${SOURCES[meta.source].badge}`}
                >
                  <span className="grid max-w-0 overflow-hidden text-[14.5px] font-semibold tracking-[-0.02em] text-white transition-[max-width] duration-300 ease-swoop group-hover:max-w-48">
                    <span className="invisible [grid-area:1/1] whitespace-nowrap pl-2.5" aria-hidden>
                      Watch on {SOURCES[meta.source].label}
                    </span>
                    <span className="[grid-area:1/1] translate-y-full whitespace-nowrap pl-2.5 transition-transform duration-300 ease-swoop group-hover:translate-y-0">
                      Watch on {SOURCES[meta.source].label}
                    </span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center text-white">
                    <ArrowUpRightIcon className="size-4" />
                  </span>
                </span>
              </>
            )}

            {duration && (
              <span className="absolute right-3 bottom-3 rounded-md bg-neutral-950/70 px-2.5 py-1.5 font-mono text-[11.5px] font-semibold tracking-normal tabular-nums backdrop-blur-md">
                {duration}
              </span>
            )}
          </a>
        )}
      </section>
    </div>
  );
};
