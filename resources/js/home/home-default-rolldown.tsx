import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useInterval } from "../hooks/use-interval";
import { SOURCE_LIST } from "@/sources";

const sources = SOURCE_LIST;

/**
 * Full cycle length, not the still time — the roll below eats into it. Stillness
 * is HOLD_MS minus ROLL.duration, so keep this comfortably the larger of the two.
 */
const HOLD_MS = 3000;

/**
 * One curve for both halves of the swap. The word and the box it sits in have
 * to arrive together — left on their separate defaults (a spring for width, a
 * tween for the roll) the headline visibly settles twice.
 */
const ROLL = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

/** Reduced motion still needs the width to keep up, just without the travel. */
const FADE = { duration: 0.2, ease: "easeOut" } as const;

/** Stable sentence for screen readers, so the rotation isn't read as churn. */
const SPOKEN = `Download videos from ${sources
  .slice(0, -1)
  .map((source) => source.label)
  .join(", ")} and ${sources[sources.length - 1].label}`;

export function HomeDefaultRolldown() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const sizerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[] | null>(null);

  useInterval(() => {
    setSourceIndex((index) => (index + 1) % sources.length);
  }, HOLD_MS);

  /**
   * Every label is measured up front, off-screen. Measuring only the label
   * that happens to be mounted reports its width a frame *after* it mounts, so
   * the mask starts widening a beat behind the word and clips it on the way in
   * — worst on the big jumps, like X to Facebook.
   */
  useLayoutEffect(() => {
    const measure = () =>
      setWidths(
        sizerRefs.current.map((node) =>
          // Round up: the mask clips, and a fractional shortfall eats the edge
          // of the last glyph.
          node ? Math.ceil(node.getBoundingClientRect().width) : 0,
        ),
      );

    measure();

    // The two things that move these numbers are the clamped font size
    // tracking the viewport and the webfont landing after first paint. Both
    // show up as a resize of the sizers themselves.
    const observer = new ResizeObserver(measure);
    for (const node of sizerRefs.current) {
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, []);

  const source = sources[sourceIndex];
  const transition = reduceMotion ? FADE : ROLL;

  return (
    <h1 className="text-center text-[clamp(32px,7vw,48px)] leading-[1.08] font-semibold tracking-[-0.04em] text-white">
      <span className="sr-only">{SPOKEN}</span>

      <span aria-hidden="true">
        <span className="block">Download videos</span>

        {/* Its own flex line: the width animation would otherwise rewrap the
            whole headline, and popLayout's absolute exit needs stable geometry.
            The offsets are percentages so they scale with the clamped size. */}
        <span className="relative flex items-baseline justify-center gap-[0.26em]">
          <span>from</span>
          <motion.span
            animate={{ width: widths?.[sourceIndex] ?? "auto" }}
            transition={transition}
            /* `relative` is load-bearing. popLayout pulls the outgoing label
               out of flow, and with no positioned ancestor here it anchors to
               the page instead: it escapes the mask and slides across "from"
               on every swap. */
            className="relative inline-block overflow-hidden whitespace-nowrap"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={source.id}
                className={`inline-block ${source.text}`}
                initial={
                  reduceMotion ? { opacity: 0 } : { y: "-60%", opacity: 0 }
                }
                animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                /* Down and out, no fade — the mask does the hiding. The mask's
                   line box carries its slack below the label, so downward the
                   label is already clear at 100% (going up it wasn't: Douyin's
                   "y" left a dash hanging above "from"). The extra 10% is
                   margin against a deeper descender in a future label. */
                exit={reduceMotion ? { opacity: 0 } : { y: "110%" }}
                transition={transition}
              >
                {source.label}
              </motion.span>
            </AnimatePresence>
          </motion.span>

          {/* Out of flow and invisible, but laid out — so it inherits the same
              clamped size the real label renders at. */}
          <span className="pointer-events-none absolute h-0 overflow-hidden opacity-0">
            {sources.map((candidate, index) => (
              <span
                key={candidate.id}
                ref={(node) => {
                  sizerRefs.current[index] = node;
                }}
                className="inline-block whitespace-nowrap"
              >
                {candidate.label}
              </span>
            ))}
          </span>
        </span>
      </span>
    </h1>
  );
}
