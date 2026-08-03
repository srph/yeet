import type { Source } from "@/sources";

/**
 * The marks are files in public/icons/sources, lifted from simple-icons and
 * Font Awesome by scripts/sync-source-icons.mjs — see that script for why the
 * sizing lives there.
 *
 * They render as CSS masks rather than <img> because every caller colours them
 * through `currentColor`: white over the badge fill, and an animated
 * neutral-600 → blue-200 on the home sample list. An <img> would paint the
 * file's own colour and lose both.
 *
 * The mask is an inline style rather than a Tailwind arbitrary value for the
 * same reason the colours in sources.ts are whole literals — a per-source
 * `mask-[url(...)]` would be composed at runtime and get purged.
 */
const SRC: Record<Source, string> = {
  youtube: "/icons/sources/youtube.svg",
  x: "/icons/sources/x.svg",
  facebook: "/icons/sources/facebook.svg",
  tiktok: "/icons/sources/tiktok.svg",
  douyin: "/icons/sources/douyin.svg",
};

/**
 * Overrides for `variant="badge"` — a mark sitting inside a solid brand tile.
 * Sparse on purpose: most sources are already bare glyphs and read the same
 * either way. YouTube's is a tile, which nests badly and buries its own
 * triangle at 10px, so on a badge it drops to the triangle alone.
 */
const BADGE_SRC: Partial<Record<Source, string>> = {
  youtube: "/icons/sources/youtube-badge.svg",
};

export function SourceIcon({
  source,
  variant = "mark",
  className,
}: {
  source: Source;
  /** `mark` stands alone; `badge` sits inside a brand-coloured tile. */
  variant?: "mark" | "badge";
  className?: string;
}) {
  const src = (variant === "badge" ? BADGE_SRC[source] : undefined) ?? SRC[source];
  const mask = `url(${src}) center / contain no-repeat`;

  return (
    <span
      aria-hidden
      className={className}
      style={{
        // `block`, not `inline-block` — an inline box sits on the text
        // baseline and reserves descender space beneath itself, which lifts
        // the mark off the centre of the line beside it. Tailwind's preflight
        // gives svg the same treatment; a span isn't covered by that rule.
        display: "block",
        background: "currentColor",
        mask,
        WebkitMask: mask,
      }}
    />
  );
}
