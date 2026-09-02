import { MuteButton, useMediaState, VolumeSlider } from "@vidstack/react";
import { Volume1Icon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mute stays a tap target everywhere. On a fine pointer a horizontal slider
 * grows out to the right of the icon so volume isn't 0/1 on desktop. Not
 * mounted when `canSetVolume` is false (iOS — the OS owns the rocker there)
 * or the pointer is coarse, so a phone never gets a hover-only control.
 *
 * In flow, max-w-0 clips it off the row until hover/focus/drag so the dock
 * doesn't reserve a dead gap. overlay paints it absolutely so a centered
 * transport (audio) never shifts. mx-4 is room for the thumb and its halo
 * at either end — without it overflow-hidden shears the disc at 0% and 100%.
 */

export function VolumeControl({
  buttonClassName,
  overlay = false,
}: {
  buttonClassName: string;
  /** Paint beside the icon without growing the row (audio transport). */
  overlay?: boolean;
}) {
  const canSetVolume = useMediaState("canSetVolume");
  const pointer = useMediaState("pointer");
  const desktop = pointer === "fine" && canSetVolume;

  return (
    <div
      className={cn(
        "group/volume shrink-0",
        overlay ? "relative" : "flex items-center",
      )}
    >
      <MuteButton className={buttonClassName}>
        <VolumeGlyph />
      </MuteButton>

      {desktop ? (
        <div
          className={cn(
            "flex items-center opacity-0 transition-all duration-150 ease-swoop",
            "group-hover/volume:opacity-100 group-focus-within/volume:opacity-100",
            "has-[[data-dragging]]:opacity-100",
            overlay
              ? "pointer-events-none absolute top-1/2 left-full z-30 -translate-y-1/2 group-hover/volume:pointer-events-auto group-focus-within/volume:pointer-events-auto has-[[data-dragging]]:pointer-events-auto"
              : "max-w-0 overflow-hidden group-hover/volume:max-w-32 group-focus-within/volume:max-w-32 has-[[data-dragging]]:max-w-32",
          )}
        >
          <VolumeSlider.Root className="relative mx-4 flex h-9 w-16 cursor-pointer touch-none items-center outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200">
            <VolumeSlider.Track className="relative h-0.75 w-full rounded-full bg-white/25">
              <VolumeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-blue-200" />
            </VolumeSlider.Track>
            <VolumeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200 shadow-[0_0_0_5px_rgba(191,219,254,0.16),0_0_12px_rgba(191,219,254,0.55)]" />
          </VolumeSlider.Root>
        </div>
      ) : null}
    </div>
  );
}

function VolumeGlyph() {
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const Glyph =
    muted || volume === 0
      ? VolumeXIcon
      : volume < 0.5
        ? Volume1Icon
        : Volume2Icon;

  return <Glyph className="size-4" />;
}
