/**
 * Regenerates public/icons/sources/*.svg from upstream icon sets.
 *
 * Attribution — X and TikTok/Douyin come from simple-icons (CC0-1.0, no
 * attribution required). YouTube and Facebook come from Font Awesome Free
 * brands (CC BY 4.0, https://fontawesome.com/license/free), which does require
 * it; that credit is repeated in AGENTS.md. Brand marks themselves remain the
 * trademarks of their owners — neither licence grants any right to those.
 *
 * The icons are committed, so this is not part of the build — run it only to
 * pull a newer upstream or to add a source:
 *
 *   node scripts/sync-source-icons.mjs
 *
 * Why the geometry lives here rather than in the upstream files: the marks are
 * used at two sizes and have to hold together as a set, so each is normalised
 * into a shared 24 box rather than trusted to arrive that way.
 *
 * `box` is the glyph's *measured* bounds within its source viewBox — its real
 * ink, not the nominal viewBox. Those differ more than you'd expect (the
 * YouTube tile inks 24x16.91 inside a 24x24 viewBox), and using the nominal
 * box silently shrinks wide-and-short glyphs while letting narrow ones run
 * tall. To re-measure after changing a source, render the path in a browser
 * and read `path.getBBox()`.
 *
 * `size` is the target extent of the glyph's *larger* dimension in the 24 box,
 * so one shared value makes the set agree. `nudge` is an optical correction in
 * 24-box units, for glyphs whose visual centre isn't their bounding-box centre.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../public/icons/sources");

/** Pinned — an unpinned fetch would silently redraw the icons on a re-run. */
const SIMPLE_ICONS = "16.28.0";
const si = (slug) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS}/icons/${slug}.svg`;
const fa = (names) => `https://api.iconify.design/fa6-brands.json?icons=${names}`;

/** Shared target extent, so the marks read as one size next to each other. */
const SIZE = 21;

/**
 * The note is narrower than the rest (0.87 aspect against X's 0.98), so the
 * shared SIZE leaves a visible gap either side of it — obvious in the home
 * list, where the marks are left-aligned in a column and the eye reads their
 * left edges as a line. It's sized to X's ink width instead, which costs it
 * ~12% extra height. Ratio is X's box width over the note's.
 */
const NOTE_SIZE = SIZE * (23.484 / 20.851);

const ICONS = {
  youtube: { url: si("youtube"), box: [0, 3.545, 24, 16.91], size: SIZE },
  // On a badge the tile is a container inside a container, and at 10px its
  // triangle all but disappears. Subpath 2 of the same mark is that triangle
  // alone, which is what YouTube's own app icon shows. It sits smaller than
  // SIZE because it's a glyph *inside* a tile rather than the whole mark.
  //
  // A right-pointing triangle's centroid is a sixth of its width left of its
  // bounding-box centre, so box-centring it looks left-shifted. The nudge is
  // half that correction — full centroid-centring overshoots and reads right.
  "youtube-badge": {
    url: si("youtube"),
    subpath: 1,
    of: 2,
    box: [9.545, 8.432, 6.273, 7.136],
    size: 15,
    nudge: [15 * 0.879 / 12, 0],
  },
  x: { url: si("x"), box: [0.258, 0, 23.484, 24], size: SIZE },
  // simple-icons ships the circle-f; Font Awesome has the bare f we want.
  facebook: { url: fa("facebook-f"), key: "facebook-f", box: [14, 0, 291.7, 512], size: SIZE },
  tiktok: { url: si("tiktok"), box: [1.574, 0, 20.851, 24], size: NOTE_SIZE },
  // Douyin is ByteDance's home-market TikTok and shares the note mark; no icon
  // set carries it separately. Kept as its own file so the colour-only
  // difference stays a data question, not a special case in the component.
  douyin: { url: si("tiktok"), box: [1.574, 0, 20.851, 24], size: NOTE_SIZE },
};

const round = (n) => Number(n.toFixed(4));

async function pathData({ url, key, subpath, of }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);

  let d;
  if (key) {
    const body = (await res.json()).icons?.[key]?.body;
    if (!body) throw new Error(`${url}: no icon "${key}"`);
    d = body.match(/ d="([^"]+)"/)?.[1];
  } else {
    d = (await res.text()).match(/<path d="([^"]+)"/)?.[1];
  }
  if (!d) throw new Error(`${url}: no path data`);

  if (subpath === undefined) return d;

  // Guards: upstream redrawing the mark would otherwise silently lift a
  // different shape. The relative form would also need resolving against the
  // previous subpath's end, so reject it rather than place the glyph wrongly.
  const parts = d.match(/[Mm][^Mm]*/g) ?? [];
  if (parts.length !== of) {
    throw new Error(`${url}: expected ${of} subpaths, got ${parts.length} — recheck the manifest`);
  }
  const part = parts[subpath].trim();
  if (!part.startsWith("M")) {
    throw new Error(`${url}: subpath ${subpath} is relative — recheck the manifest`);
  }

  return part;
}

await mkdir(OUT, { recursive: true });

for (const [name, icon] of Object.entries(ICONS)) {
  const d = await pathData(icon);
  const [bx, by, bw, bh] = icon.box;
  const [nx, ny] = icon.nudge ?? [0, 0];
  // Fit the larger dimension, so aspect is preserved and the set agrees.
  const scale = icon.size / Math.max(bw, bh);
  const tx = round((24 - bw * scale) / 2 - bx * scale + nx);
  const ty = round((24 - bh * scale) / 2 - by * scale + ny);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">` +
    `<g transform="translate(${tx} ${ty}) scale(${round(scale)})">` +
    `<path fill="currentColor" d="${d}"/>` +
    `</g></svg>\n`;

  await writeFile(join(OUT, `${name}.svg`), svg);
  console.log(`${name}.svg`);
}
