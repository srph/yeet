import {
  MediaPlayer,
  MediaProvider,
  PlayButton,
  Time,
  TimeSlider,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import {
  MusicIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { DownloadMeta } from "../types";
import { VolumeControl } from "./home-download-volume";
import "./vidstack-player-styles";

/**
 * The settled mp3 plate. An album read, stripped: artwork, a scrub line, three
 * buttons. No title, source or bitrate — the rail is already saying all three
 * a column to the left, and repeating them is how the plate ended up looking
 * like a card.
 *
 * Only mounted once download_url is non-null.
 */

const GHOST =
  "grid size-9 place-items-center rounded-full text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200";

export function HomeDownloadAudioPlayer({
  meta,
  src,
  onSourceError,
}: {
  meta: DownloadMeta;
  /** meta.download_url, narrowed to non-null by the caller. */
  src: string;
  /** The presigned link lasts an hour; a stale one surfaces here. */
  onSourceError?: () => void;
}) {
  return (
    <MediaPlayer
      src={{ src, type: "audio/mpeg" }}
      title={meta.source_title}
      viewType="audio"
      streamType="on-demand"
      onError={onSourceError}
    >
      {/* No <Poster>: the cover below is an <img> so the missing-thumbnail
          case can fall back to the same panel the waiting plate uses. */}
      <MediaProvider />

      <div className="flex w-full flex-col">
        <Cover meta={meta} />

        <div className="flex flex-col gap-4 pt-16">
          <div className="flex items-center gap-3">
            <Stamp>
              <Time type="current" />
            </Stamp>

            <TimeSlider.Root className="group/seek relative flex h-4.5 flex-1 cursor-pointer touch-none items-center outline-none">
              <TimeSlider.Track className="relative h-0.75 w-full rounded-full bg-neutral-800">
                <TimeSlider.Progress className="absolute h-full w-[var(--slider-progress)] rounded-full bg-neutral-700" />
                <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-blue-200" />
              </TimeSlider.Track>
              {/* accent halo rather than a dark ring, which would notch the
                  fill it sits on */}
              <TimeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200 opacity-0 shadow-[0_0_0_5px_rgba(191,219,254,0.16),0_0_12px_rgba(191,219,254,0.55)] transition-opacity group-hover/seek:opacity-100 group-data-[dragging]/seek:opacity-100" />
            </TimeSlider.Root>

            <Stamp>
              <Time type="duration" />
            </Stamp>
          </div>

          <div className="flex items-center justify-center gap-5">
            <Restart />

            <PlayButton className="grid size-14 place-items-center rounded-full bg-blue-200 text-blue-950 transition-colors hover:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200">
              <ToggleGlyph className="size-5" />
            </PlayButton>

            <VolumeControl buttonClassName={GHOST} overlay />
          </div>
        </div>
      </div>
    </MediaPlayer>
  );
}

/**
 * Sized to sit against the 274px rail rather than over it — a cover wider than
 * the column beside it reads as the page's subject instead of one of two
 * things on it.
 */
function Cover({ meta }: { meta: DownloadMeta }) {
  const paused = useMediaState("paused");

  return (
    <div className="relative aspect-square w-53 max-w-full self-center overflow-hidden rounded-xl bg-neutral-800 shadow-[0_42px_80px_-32px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05)]">
      {meta.source_thumbnail ? (
        <img
          src={meta.source_thumbnail}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        // X posts frequently have no thumbnail, and with the title stripped
        // this is the only thing identifying the file — so it gets the same
        // panel the waiting plate draws rather than an empty square.
        <div className="grid size-full place-items-center text-neutral-600">
          <MusicIcon className="size-7" />
        </div>
      )}

      <PlayButton
        className={`absolute inset-0 grid place-items-center bg-neutral-950/30 text-white transition-opacity duration-300 ease-swoop focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-200 ${
          paused ? "opacity-100" : "opacity-0 hover:opacity-100"
        }`}
      >
        <ToggleGlyph className="size-6" />
      </PlayButton>
    </div>
  );
}

/** Back to the top, rather than a relative skip — there is one file here. */
function Restart() {
  const remote = useMediaRemote();

  return (
    <button
      type="button"
      aria-label="Restart"
      onClick={(event) => remote.seek(0, event.nativeEvent)}
      className={GHOST}
    >
      <RotateCcwIcon className="size-4" />
    </button>
  );
}

function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs font-bold tracking-widest text-neutral-600 tabular-nums">
      {children}
    </span>
  );
}

function ToggleGlyph({ className }: { className: string }) {
  const paused = useMediaState("paused");

  return paused ? (
    <PlayIcon className={`${className} translate-x-px`} fill="currentColor" />
  ) : (
    <PauseIcon className={className} fill="currentColor" />
  );
}

