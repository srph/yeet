import { Tooltip } from "@base-ui/react/tooltip";
import { motion, useReducedMotion } from "motion/react";
import { type CSSProperties, useState } from "react";

export type DailyViews = {
  date: string;
  /** Sum across every page that day, including any not listed in PAGES. */
  views: number;
  pages: Record<string, number>;
};

type Column = DailyViews & { label: string };

/**
 * Drawn in DOM rather than SVG, and with no charting dependency: a bar height
 * is `views / max`, a stack is a flex column, and the dot field behind each
 * column is a masked pseudo-element (`.chart-track` in app.css). SVG would give
 * cleaner rotated labels and a simpler segment gap, but it needs a measured
 * pixel width plus a resize observer to keep 10.5px text at 10.5px. Flex is
 * responsive for nothing, which wins at this size.
 *
 * Base UI owns the readout. One `Tooltip.Root` bound to a handle, with every
 * column a `Tooltip.Trigger` carrying its day as the payload — so a single
 * popup travels across the chart instead of thirty mounting and unmounting.
 * That also buys focus handling, portalling and ARIA for free.
 *
 * Motion is used where CSS genuinely can't: the columns grow from the baseline
 * in a stagger on mount, and the popup scales from its anchor. Two things stay
 * CSS on purpose — the hover state on the dot track, which is one property on
 * one element, and the readout's glide between columns, which motion cannot own
 * because Floating UI rewrites that transform inline on every reposition.
 */

/**
 * Stacked top-down, so `about` caps the bar and `home` is the base. `home` last
 * is deliberate: the final segment takes `flex-1` rather than a fixed share, so
 * it absorbs any page in the payload that isn't listed here. That keeps a bar's
 * total honest if a new route starts being counted before it's given a colour.
 * The readout lists every key regardless, so nothing is silently dropped.
 *
 * Labelled by path, not by route name. `site_views.page` stores the route name
 * because that survives a URL change, but the readout is read against the site,
 * where these are `/` and `/about`. A page with no entry here falls back to its
 * route name in `rowsFor` — an invented path would be worse than an honest key.
 */
const PAGES = [
  { key: "about", label: "/about", color: "var(--color-neutral-500)" },
  { key: "home", label: "/", color: "var(--color-blue-200)" },
];

/**
 * Counted back from the last column, so today is always labelled and the step
 * never breaks at the right-hand edge. Calendar Mondays would stop the labels
 * drifting, at the cost of a short final gap.
 */
const LABEL_EVERY = 7;

const number = new Intl.NumberFormat();
const dayLabel = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

/**
 * One popup shared by every column. Module scope because the handle identifies
 * a tooltip family, not an instance — the card only ever renders one chart.
 */
const readout = Tooltip.createHandle<Column>();

/**
 * Parsed as `${date}T00:00:00` rather than the bare YYYY-MM-DD: the bare form
 * is spec'd as UTC midnight, which renders as the previous day for anyone west
 * of Greenwich — every column would be labelled one day early.
 */
function toColumns(daily: DailyViews[]): Column[] {
  return daily.map((day, index) => ({
    ...day,
    label:
      index === daily.length - 1
        ? "Today"
        : dayLabel.format(new Date(`${day.date}T00:00:00`)),
  }));
}

/** Known pages first, in stack order reversed so the base reads first. */
function rowsFor(column: Column) {
  const known = [...PAGES].reverse();
  const extra = Object.keys(column.pages).filter(
    (key) => !PAGES.some((page) => page.key === key),
  );

  return [
    ...known.map((page) => ({
      ...page,
      value: column.pages[page.key] ?? 0,
    })),
    ...extra.map((key) => ({
      key,
      label: key,
      color: "var(--color-neutral-600)",
      value: column.pages[key] ?? 0,
    })),
  ];
}

export function DashboardTrafficChart({ daily }: { daily: DailyViews[] }) {
  const reduceMotion = useReducedMotion();
  // State, not a ref: `collisionBoundary` takes an element, and a ref is still
  // null on the render that mounts the plot.
  const [plot, setPlot] = useState<HTMLDivElement | null>(null);

  const columns = toColumns(daily);
  const last = columns.length - 1;

  // Scaled to the window's own maximum so the tallest bar reaches the top of
  // the dot field. Padding it to a round number would make that ceiling a lie.
  // Floored at 1 so a window of all-zero days renders a flat baseline instead
  // of dividing by zero.
  const max = Math.max(1, ...columns.map((column) => column.views));

  return (
    <div>
      {/* Fixed height so revealing a label can never reflow the plot. Sized to
          the longest label's rotated extent — about 42px for six glyphs of
          10.5px mono — plus clearance. */}
      <div className="mb-2 flex h-11.5">
        {columns.map((column, index) => (
          <span key={column.date} className="relative min-w-0 flex-1">
            {(last - index) % LABEL_EVERY === 0 ? (
              <i className="chart-label absolute bottom-0 left-1/2 w-max max-w-18 font-mono text-[10.5px] leading-none tracking-[0.06em] whitespace-nowrap text-neutral-400 uppercase not-italic">
                {column.label}
              </i>
            ) : null}
          </span>
        ))}
      </div>

      <div ref={setPlot} className="relative flex h-22">
        {columns.map((column, index) => (
          // The column is the hit target, not the bar: on a quiet day the bar
          // is a few pixels tall and near-impossible to point at. Being a real
          // button means keyboard focus opens the same readout, which is the
          // whole accessibility story for this chart.
          <Tooltip.Trigger
            key={column.date}
            type="button"
            handle={readout}
            payload={column}
            delay={0}
            closeDelay={0}
            aria-label={`${column.label}: ${number.format(column.views)} views`}
            className="group relative min-w-0 flex-1 cursor-crosshair focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          >
            <span
              aria-hidden
              className="chart-track absolute inset-y-0 left-1/2 -translate-x-1/2 transition-colors group-hover:bg-neutral-600 group-focus-visible:bg-neutral-600"
            />

            {/* A day with no traffic gets no bar at all, just its column of
                dots. A minimum-height stub would read as "1 view" rather than
                none, and the dot field is what makes an absent bar legible as
                a real zero instead of a rendering fault.

                The sheet-coloured backdrop is what makes the 2px gap between
                segments read as a clean slot — without it the dot field shows
                straight through the gap. */}
            {column.views > 0 ? (
              <motion.span
                aria-hidden
                className="absolute inset-x-0.5 bottom-0 flex min-h-0.75 flex-col gap-0.5 bg-neutral-800"
                initial={reduceMotion ? false : { height: 0 }}
                animate={{
                  height: `${(column.views / max) * 100}%`,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.012,
                  ease: [0.19, 1, 0.22, 1],
                }}
              >
                {PAGES.map((page, position) => {
                  const share = column.pages[page.key] ?? 0;
                  const base = position === PAGES.length - 1;

                  // Same reasoning one level down: a page with no views that day
                  // shouldn't leave a 2px sliver of its colour behind. The base
                  // segment always renders — it's carrying the remainder.
                  if (share === 0 && !base) {
                    return null;
                  }

                  return (
                    <span
                      key={page.key}
                      className={
                        base
                          ? "min-h-0.5 flex-1 rounded-t-[1px] bg-(--swatch)"
                          : "min-h-0.5 shrink-0 basis-(--share) rounded-t-[1px] bg-(--swatch)"
                      }
                      style={
                        {
                          "--swatch": page.color,
                          "--share":
                            column.views > 0
                              ? `${(share / column.views) * 100}%`
                              : "0%",
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </motion.span>
            ) : null}
          </Tooltip.Trigger>
        ))}

        {/* The popup always mounts and only its contents are guarded. Gating
            the whole subtree on `payload` leaves Base UI nothing to open — the
            trigger picks up `data-popup-open` and no panel ever appears. */}
        <Tooltip.Root handle={readout}>
          {({ payload }) => (
            <Tooltip.Portal>
              <Tooltip.Positioner
                // Beside the column, not over it. The anchor is the full-height
                // column, so `align: center` puts the panel on the plot's
                // vertical centre for free — no offset arithmetic, and it never
                // moves vertically while you scrub.
                side="right"
                align="center"
                sideOffset={10}
                // Collision is against the plot, not the viewport. The card is
                // far narrower than the window, so the end columns would never
                // be corrected on their own.
                collisionBoundary={plot ?? "clipping-ancestors"}
                collisionPadding={0}
                // Flip to the left of the column once the right doesn't fit, so
                // the panel is always on the side with room and never covers the
                // bar being read. `fallbackAxisSide: none` keeps it off the
                // vertical axis, which would reintroduce the bobbing.
                //
                // `align: none` matters: with `side: right` the align axis is
                // vertical, and the panel is a few pixels taller than the plot
                // it's bounded by — so `shift` nudged it down to fit and left it
                // permanently off-centre. Overhanging the plot very slightly is
                // the correct look; being 4px low is not.
                collisionAvoidance={{
                  side: "flip",
                  align: "none",
                  fallbackAxisSide: "none",
                }}
                // Glide between columns rather than teleporting. This has to be
                // a CSS transition rather than `motion`: Floating UI writes the
                // transform inline on every reposition, so a JS animation would
                // be overwritten on the next frame. `data-instant` is Base UI
                // telling us to skip the tween — honour it, or the panel slides
                // in from its last position when it reopens.
                className="z-40 transition-transform duration-200 ease-swoop data-instant:transition-none"
              >
                <Tooltip.Popup
                  render={
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.96,
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.14,
                        ease: [0.19, 1, 0.22, 1],
                      }}
                    />
                  }
                  className="min-w-37.5 origin-(--transform-origin) rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-2 font-mono tracking-[0.03em] tabular-nums shadow-lg outline-none"
                >
                  {/* Negative margin equal to the padding, pushed back in as
                        padding, so the rule spans the panel edge to edge. Both
                        sides read the same value — hard-coding the bleed leaves
                        the rule short the moment the padding is retuned. */}
                  <div className="-mx-2.5 mb-1.75 flex items-baseline justify-between gap-4 border-b border-neutral-700 px-2.5 pb-1.75">
                    <span className="text-[10px] tracking-[0.06em] text-neutral-400 uppercase">
                      {payload?.label}
                    </span>
                    <span className="text-[15px] font-medium tracking-[-0.01em] text-white">
                      {number.format(payload?.views ?? 0)}
                    </span>
                  </div>

                  {(payload ? rowsFor(payload) : []).map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center gap-2 text-[11.5px] tracking-[0.02em] text-neutral-300 not-first:mt-0.75"
                    >
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-[2px] bg-(--swatch)"
                        style={
                          {
                            "--swatch": row.color,
                          } as CSSProperties
                        }
                      />
                      {row.label}
                      <span className="ml-auto pl-3.5 text-[12.5px] font-medium tracking-[0.02em] text-white">
                        {number.format(row.value)}
                      </span>
                    </div>
                  ))}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </div>
    </div>
  );
}
