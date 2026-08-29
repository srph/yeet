import {
  Controls,
  FullscreenButton,
  MediaPlayer,
  MediaProvider,
  MuteButton,
  PlayButton,
  Poster,
  Time,
  TimeSlider,
  useMediaState,
} from "@vidstack/react";
import {
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import type { DownloadMeta } from "../types";

/**
 * The settled mp4 plate: the encoded file itself, playing in place of the
 * thumbnail that used to link out.
 *
 * All chrome lives under a bottom scrim and stays hidden until Vidstack says
 * the controls are visible, so a paused player reads exactly like the old
 * thumbnail. The seek bar sits on its own row above the buttons: the scrub
 * target is then the full width of the frame rather than whatever is left
 * between the timecode and the volume toggle.
 *
 * Only mounted once download_url is non-null — HomeDownloadTracking keeps its
 * shimmering thumbnail for every other state.
 */

/** Shared by both dock rows; size-7 is the smallest that still clears a thumb. */
const ICON_BUTTON =
  "grid size-7 shrink-0 place-items-center rounded-md text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200";

export function HomeDownloadVideoPlayer({
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
      src={{ src, type: "video/mp4" }}
      title={meta.source_title}
      viewType="video"
      streamType="on-demand"
      playsInline
      // The same thumbnail the waiting state was already showing, so nothing
      // visibly swaps when the job settles.
      poster={meta.source_thumbnail ?? undefined}
      onError={onSourceError}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(191,219,254,0.34),0_0_90px_-26px_rgba(191,219,254,0.42)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
    >
      {/* contain, not cover: TikTok and Douyin are vertical, and cover would
          crop the subject out of a 16:9 frame. */}
      <MediaProvider className="size-full [&>video]:size-full [&>video]:object-contain">
        {meta.source_thumbnail ? (
          <Poster
            alt=""
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
          />
        ) : null}
      </MediaProvider>

      <CenterPlay />

      {/* Vidstack owns visibility here: it handles pointer idle, touch and
          keyboard, which a bare :hover never gets right on a phone. */}
      <Controls.Root
        className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 transition-opacity duration-300 ease-swoop data-[visible]:opacity-100"
        hideOnMouseLeave
      >
        {/* the scrim, sized to the chrome rather than the frame */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/85 via-black/45 to-transparent" />

        <Controls.Group className="relative flex flex-col gap-2 px-4 pb-3">
          <TimeSlider.Root className="group/seek relative flex h-4.5 w-full cursor-pointer touch-none items-center outline-none">
            <TimeSlider.Track className="relative h-0.75 w-full rounded-full bg-white/25">
              <TimeSlider.Progress className="absolute h-full w-[var(--slider-progress)] rounded-full bg-white/20" />
              <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-blue-200" />
            </TimeSlider.Track>
            {/* accent halo, not a dark cut-out: a ring in near-black punched a
                visible notch out of the fill it was sitting on */}
            <TimeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200 opacity-0 shadow-[0_0_0_5px_rgba(191,219,254,0.16),0_0_12px_rgba(191,219,254,0.55)] transition-opacity group-hover/seek:opacity-100 group-data-[dragging]/seek:opacity-100" />
          </TimeSlider.Root>

          {/* [Play] [Time] ————— [Audio] [Fullscreen] */}
          <div className="flex items-center gap-3">
            <PlayButton className={ICON_BUTTON}>
              <ToggleGlyph />
            </PlayButton>

            {/* <Time> renders a block-level div, so this wrapper has to be a
                flex row — whitespace-nowrap cannot stop a block from taking a
                line of its own. */}
            <span className="flex shrink-0 items-baseline gap-1 text-xs font-medium tracking-normal text-white tabular-nums">
              <Time type="current" />
              <span className="text-white/55">/</span>
              <Time type="duration" className="text-white/55" />
            </span>

            <span className="flex-1" />

            <MuteButton className={ICON_BUTTON}>
              <VolumeGlyph />
            </MuteButton>

            <FullscreenButton className={ICON_BUTTON}>
              <FullscreenGlyph />
            </FullscreenButton>
          </div>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  );
}

/**
 * The one control that is not in the dock. Was larger, with an offset shadow
 * and a white hairline ring; the ring did nothing on a near-white fill but
 * muddy the edge, and the offset made it read as pasted on. Now ringless and
 * lit by a centred bloom, so it separates from a bright frame without an edge.
 */
function CenterPlay() {
  const paused = useMediaState("paused");

  return (
    <PlayButton
      className={`absolute inset-0 z-10 m-auto grid size-16 place-items-center rounded-full bg-blue-200 text-blue-950 shadow-[0_2px_30px_rgba(0,0,0,0.5)] transition duration-300 ease-swoop hover:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200 ${
        paused
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-90 opacity-0"
      }`}
    >
      {/* geometric centring leaves a triangle looking left-heavy */}
      <PlayIcon className="size-6 translate-x-px" fill="currentColor" />
    </PlayButton>
  );
}

function ToggleGlyph() {
  const paused = useMediaState("paused");

  return paused ? (
    <PlayIcon className="size-4 translate-x-px" fill="currentColor" />
  ) : (
    <PauseIcon className="size-4" fill="currentColor" />
  );
}

function VolumeGlyph() {
  const muted = useMediaState("muted");
  const Glyph = muted ? VolumeXIcon : Volume2Icon;

  return <Glyph className="size-4" />;
}

function FullscreenGlyph() {
  const active = useMediaState("fullscreen");
  const Glyph = active ? MinimizeIcon : MaximizeIcon;

  return <Glyph className="size-4" />;
}
