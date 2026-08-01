import type { Source } from "@/sources";

/**
 * lucide dropped brand glyphs in v1, so these marks stay inline. Only the
 * sources that actually surface a glyph have art — Facebook, TikTok and Douyin
 * read through the badge colour alone, and render nothing here.
 */
const PATHS: Partial<Record<Source, string>> = {
  youtube:
    "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z",
  x: "M18.2 2.2h3.4l-7.4 8.5L23 21.8h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2.2h7l4.8 6.4 5.4-6.4Zm-1.2 17.6h1.9L7.1 4.1H5.1l11.9 15.7Z",
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
