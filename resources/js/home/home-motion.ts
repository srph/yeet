import { useReducedMotion, type Transition } from "motion/react";

/**
 * The home ↔ tracking handoff, as a fade-through on one axis: the outgoing
 * screen accelerates away first, then the incoming one settles in. Forward
 * travels up, Start over travels down — the same move played backwards.
 *
 * The overlap is deliberate but short. ENTER_AT lands just before EXIT ends,
 * when the outgoing screen is nearly transparent, so the two never read as
 * one composite the way the old simultaneous crossfade did.
 */

const EXIT: Transition = { duration: 0.18, ease: [0.4, 0, 1, 1] };

const ENTER_AT = 0.14;

const enter = (delay: number, duration = 0.45): Transition => ({
  type: "spring",
  bounce: 0,
  duration,
  delay,
});

const railEnter = (index: number) => enter(ENTER_AT + 0.03 + index * 0.045);

/** The rail's blocks, in order. The mobile dock lands with ACTIONS. */
export const RAIL = { STATUS: 0, TITLE: 1, SPECS: 2, ACTIONS: 3 } as const;

/** The first sample row's place in home's order, after headline and field. */
export const HOME_SAMPLES_INDEX = 2;

/**
 * Offsets are written as a raw `transform` rather than `y`: motion hands a
 * transform string to WAAPI with the opacity, so both run on the compositor.
 * `y` is driven from the main thread, which is busy at exactly this moment —
 * mounting the incoming screen and, for a row that arrives complete,
 * evaluating the player chunk — so a stall there would desync the slide
 * from the fade.
 *
 * The cost is that MotionConfig's reducedMotion only strips the individual
 * transform keys, not a raw transform, so reduced motion is honoured here:
 * the fades stay, the travel goes.
 *
 * Rest is spelled out with the same functions as the offset, never "none":
 * motion stands in for "none" by zeroing every number in the other keyframe,
 * which turns scale(0.985) into scale(0) and collapses the plate.
 */
export function useHomeMotion() {
  const reduce = useReducedMotion();
  const rest = (scaled = false) =>
    scaled ? "translateY(0px) scale(1)" : "translateY(0px)";
  const shift = (y: number, scale?: number) =>
    reduce
      ? rest(scale !== undefined)
      : `translateY(${y}px)${scale === undefined ? "" : ` scale(${scale})`}`;

  return {
    /** Home leaving for tracking: up and out, as one block. */
    homeExit: { opacity: 0, transform: shift(-12), transition: EXIT },

    /** Tracking leaving for home: down and out, as one block. */
    trackingExit: { opacity: 0, transform: shift(12), transition: EXIT },

    /**
     * Home settling in from above, top to bottom: headline, field, then each
     * sample row. First paint stays static because Home's AnimatePresence
     * blocks initial animations under it.
     */
    homeSettle: (index: number) => ({
      initial: { opacity: 0, transform: shift(-12) },
      animate: { opacity: 1, transform: rest() },
      transition: enter(ENTER_AT + index * 0.026),
    }),

    /** Tracking rising in from below: the plate leads. */
    plateRise: {
      initial: { opacity: 0, transform: shift(16, 0.985) },
      animate: { opacity: 1, transform: rest(true) },
      transition: enter(ENTER_AT, 0.5),
    },

    /** …and the rail follows a beat behind, block by block. */
    railRise: (index: number) => ({
      initial: { opacity: 0, transform: shift(10) },
      animate: { opacity: 1, transform: rest() },
      transition: railEnter(index),
    }),

    /** The mobile dock: up with the rail's actions, down with the exit. */
    dock: {
      initial: { opacity: 0, transform: shift(16) },
      animate: {
        opacity: 1,
        transform: rest(),
        transition: railEnter(RAIL.ACTIONS),
      },
      exit: { opacity: 0, transform: shift(16), transition: EXIT },
    },
  };
}
