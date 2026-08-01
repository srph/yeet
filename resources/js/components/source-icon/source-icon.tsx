import type { Source } from "@/sources";

/**
 * lucide dropped brand glyphs in v1, so these marks stay inline. Facebook is
 * the one source without art — it reads through the badge colour alone and
 * renders nothing here.
 */

/** Douyin is ByteDance's home-market TikTok and shares the note mark; the two
 *  differ only in colour, which the badge already carries. */
const NOTE =
  "M16.5 3a5.1 5.1 0 0 0 3.9 3.4v3a8 8 0 0 1-3.9-1.4v6.2a6.2 6.2 0 1 1-6.2-6.2c.3 0 .6 0 .9.1v3.1a3.2 3.2 0 1 0 2.2 3V3h3.1Z";

const PATHS: Partial<Record<Source, string>> = {
  youtube:
    "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z",
  x: "M18.2 2.2h3.4l-7.4 8.5L23 21.8h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2.2h7l4.8 6.4 5.4-6.4Zm-1.2 17.6h1.9L7.1 4.1H5.1l11.9 15.7Z",
  tiktok: NOTE,
  douyin: NOTE,
};

export function SourceIcon({
  source,
  className,
}: {
  source: Source;
  className?: string;
}) {
  const path = PATHS[source];

  if (!path) return null;

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}
