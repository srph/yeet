import { useEffect, useRef, useState } from "react";

/**
 * Widths for the rolldown's labels, measured off-screen and kept current.
 *
 * The headline animates the width of the mask around the rotating source, so
 * it needs each label's width *before* that label mounts. Measuring only the
 * label that happens to be on screen reports the new width a frame late, and
 * the mask spends that frame clipping the word it is meant to be revealing.
 *
 * Attach `refs` to one hidden span per label, in the same order as the labels
 * themselves; `widths` is null until there is a trustworthy number.
 */
export function useRolldownMeasure() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[] | null>(null);

  useEffect(() => {
    const measure = () =>
      setWidths(
        refs.current.map((node) =>
          // Round up: the mask clips, and a fractional shortfall eats the edge
          // of the last glyph.
          node ? Math.ceil(node.getBoundingClientRect().width) : 0,
        ),
      );

    const observer = new ResizeObserver(measure);
    let cancelled = false;

    // Nothing is published until the webfont has landed. DM Sans is served
    // font-display: swap, so anything measured at mount reads the fallback
    // face — a few px narrow — and the mask would clip the tail of the word
    // until the observer caught up. Staying on `auto` until then is never
    // wrong, just unanimated.
    //
    // @WARNING This face is hard-coded from the headline's own type: the
    // family is --font-sans in app.css, the 600 is the h1's `font-semibold`.
    // Change either and this string has to follow. The size is only there to
    // make the CSS font shorthand valid — it plays no part in matching.
    //
    // @WARNING It fails silently. An unmatched family resolves the promise
    // immediately without loading anything, which puts us back to measuring
    // the fallback face and clipping the word. There is no throw to catch;
    // the only symptom is the bug returning.
    //
    // `load` is used over the softer `fonts.ready` deliberately — ready only
    // covers faces the browser has already decided it needs, so it can resolve
    // early if layout hasn't requested this one yet. This demands it outright.
    document.fonts.load('600 48px "Switzer"').then(() => {
      if (cancelled) {
        return;
      }

      // Observing reports current size straight away, so this doubles as the
      // first measurement. Later fires are the clamped font size tracking the
      // viewport.
      for (const node of refs.current) {
        if (node) {
          observer.observe(node);
        }
      }
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return { refs, widths };
}
