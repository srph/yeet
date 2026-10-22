import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import useMeasure from "react-use-measure";
import {
  FilmIcon,
  ArrowUpRightIcon,
  MusicIcon,
} from "lucide-react";
import type { DownloadMeta } from "../types";
import { DownloadStatus } from "@/components/download-status/download-status";
import { SOURCES } from "@/sources";
import { HomeDownloadActions } from "./home-download-actions";
import { formatDuration, HomeDownloadSpecs } from "./home-download-specs";
import { RAIL, useHomeMotion } from "./home-motion";

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

/** Crossfade the title while its measured height carries the sheet below it. */
function TrackingTitle({ title }: { title: string }) {
  const reduce = useReducedMotion();
  const [ref, { height }] = useMeasure();

  return (
    <motion.div
      initial={false}
      animate={{ height: height || "auto" }}
      transition={{ duration: reduce ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.h1
          key={title}
          ref={ref}
          initial={{ opacity: 0, transform: `translateY(${reduce ? 0 : 4}px)` }}
          animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: reduce ? 0 : 0.36, delay: reduce ? 0 : 0.12 } }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.12 } }}
          className="text-xl leading-[1.28] font-semibold tracking-[-0.035em] text-white"
        >
          {title}
        </motion.h1>
      </AnimatePresence>
    </motion.div>
  );
}

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

  const { plateRise, railRise } = useHomeMotion();

  // Fades the thumbnail in rather than letting it pop when it decodes. Set
  // once and never cleared: the probe can swap source_thumbnail for a better
  // one, and the old image holds until the new one is ready on its own.
  const [isThumbnailShown, setIsThumbnailShown] = useState(false);

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

  return (
    // viewport-relative, not 100%: the parent is a centred grid item and so is
    // shrink-to-fit, which a percentage width would resolve against.
    //
    // layout="position": desktop centres this block, so the rail growing at
    // Ready moves the whole thing up — this glides it there instead.
    <motion.div
      layout="position"
      className="grid w-[min(1000px,100vw_-_2rem)] grid-cols-1 items-start gap-6 min-[880px]:grid-cols-[274px_1fr] min-[880px]:gap-10"
    >
      {/* ── the rail ── */}
      <section className="min-w-0">
        <motion.div {...railRise(RAIL.STATUS)}>
          <DownloadStatus status={status} scramble className="mb-2" />
        </motion.div>

        <motion.div {...railRise(RAIL.TITLE)}>
          <TrackingTitle title={meta.source_title} />
        </motion.div>

        <motion.dl {...railRise(RAIL.SPECS)} className="mt-4">
          <HomeDownloadSpecs meta={meta} />
        </motion.dl>

        {/* Desktop only. On mobile this same block is docked to the bottom of
            the viewport by Home, where it sits outside the scrolling page. */}
        <motion.div
          {...railRise(RAIL.ACTIONS)}
          className="mt-5.5 hidden min-[880px]:block"
        >
          <HomeDownloadActions
            status={status}
            onRetry={onRetry}
            onDownload={onDownload}
            onDownloadAnother={onDownloadAnother}
          />
        </motion.div>
      </section>

      {/* ── the plate ── */}
      <motion.section
        {...plateRise}
        className="order-first w-full min-[880px]:order-none"
      >
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
                // A cached thumbnail can finish decoding before React attaches
                // onLoad, so check on mount as well.
                ref={(img) => {
                  if (img?.complete && img.naturalWidth > 0) setIsThumbnailShown(true);
                }}
                onLoad={() => setIsThumbnailShown(true)}
                src={meta.source_thumbnail}
                alt=""
                className={`size-full object-cover transition-[filter,opacity] duration-700 ease-swoop ${
                  isThumbnailShown ? "" : "opacity-0"
                } ${isWaiting ? "brightness-50 grayscale-[0.85]" : ""} ${
                  isDead ? "brightness-[0.3] grayscale" : ""
                } ${isSettled ? "scale-[1.02]" : ""}`}
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
      </motion.section>
    </motion.div>
  );
};
