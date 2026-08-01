/**
 * The one place a source is described. The zod enum in types.ts, the home
 * headline, the /about chips, the thumbnail badge and the dashboard table all
 * read from here, so adding a source is a single entry rather than six edits.
 *
 * Colours are Tailwind classes rather than hex because every consumer applies
 * them as classes. Keep them as whole literals — Tailwind scans for complete
 * class names, so a composed `text-${hue}-400` would be purged.
 */

export const SOURCE_IDS = [
  "youtube",
  "x",
  "facebook",
  "tiktok",
  "douyin",
] as const;

export type Source = (typeof SOURCE_IDS)[number];

export type SourceMeta = {
  label: string;
  host: string;
  /**
   * Display text on near-black. A step lighter than `badge`: the 600/700 fills
   * below are sized for a solid chip and go muddy as large type.
   */
  text: string;
  /** Solid fill behind a white glyph — thumbnail badge, dashboard tile. */
  badge: string;
  /** Tinted pill — the /about list. */
  chip: string;
};

export const SOURCES: Record<Source, SourceMeta> = {
  youtube: {
    label: "YouTube",
    host: "youtube.com",
    text: "text-red-400",
    badge: "bg-red-700",
    chip: "bg-red-950 text-red-300",
  },
  x: {
    label: "X",
    host: "x.com",
    text: "text-white",
    // Near-black on a dark surface needs an edge or the tile disappears.
    badge: "bg-neutral-950 border border-neutral-700",
    chip: "bg-neutral-800 text-neutral-200",
  },
  facebook: {
    label: "Facebook",
    host: "facebook.com",
    text: "text-blue-400",
    badge: "bg-blue-600",
    chip: "bg-blue-950 text-blue-300",
  },
  tiktok: {
    label: "TikTok",
    host: "tiktok.com",
    text: "text-rose-400",
    badge: "bg-rose-600",
    chip: "bg-rose-950 text-rose-300",
  },
  douyin: {
    label: "Douyin",
    host: "douyin.com",
    text: "text-orange-400",
    badge: "bg-orange-600",
    chip: "bg-orange-950 text-orange-300",
  },
};

/** Declaration order, for the places that render every source in turn. */
export const SOURCE_LIST = SOURCE_IDS.map((id) => ({ id, ...SOURCES[id] }));

/**
 * Dashboard rows arrive from Inertia as loose strings, so lookups there have to
 * narrow before indexing SOURCES.
 */
export function isSource(value: string): value is Source {
  return (SOURCE_IDS as readonly string[]).includes(value);
}
