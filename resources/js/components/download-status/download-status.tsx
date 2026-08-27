import { Check, ClockFading } from "lucide-react";
import type { ReactNode } from "react";

import { DecryptedText } from "@/components/decrypted-text/decrypted-text";
import { cn } from "@/lib/utils";
import type { DownloadStatus as Status } from "@/types";

/**
 * The one status readout. The post-submit rail and the dashboard table both
 * render this — previously they were two components, three files apart, that
 * disagreed on colour: `complete` was emerald on the rail and blue-200 in the
 * table, which is the same blue the rail used for "in progress".
 *
 * Tone is one text colour per state and nothing else: the fill is currentColor
 * at 14%, so it derives from the label rather than being a second token that
 * can drift out of sync.
 *
 * Copy is deliberately not the enum. The rail is the app's one hero moment and
 * the dashboard is one operator, so a single vocabulary serves both — but it
 * has to fit `COLUMN_WIDTHS.status` (110px), and mono is wide. At 10.5px with
 * 0.14em tracking every character costs ~7.8px, which caps a label at roughly
 * ten. That is why the labels are one short word each, and why the widest
 * ("Sniffing", ~94px) is the one to re-measure if the type ever changes.
 */

/**
 * Amber, not blue: blue-200 is the action accent (button fill, focus ring,
 * link hover), and on the rail this tag sits directly above a blue-200 CTA —
 * colour-matching the button that says "wait" was the old bug. Amber also
 * agrees with the scanline the thumbnail already draws during these states.
 *
 * `probing` and `processing` share a tone on purpose. The reader doesn't need
 * to colour-discriminate two flavours of "wait"; the label says which.
 *
 * `expired` sits at neutral-400 rather than a darker grey because at 10.5px
 * neutral-600 measures 2.36:1 against its own tint and neutral-500 only 3.71:1
 * — both under 4.5:1. That makes it share a colour with `queued`, which is why
 * the marker carries the distinction instead: a circle against a clock face
 * is a shape difference, and survives a dim panel and a colour-blind reader in
 * a way a grey step does not.
 */
const TONE: Record<Status, string> = {
  queued: "text-neutral-400",
  probing: "text-amber-300",
  processing: "text-amber-300",
  complete: "text-emerald-400",
  failed: "text-red-400",
  expired: "text-neutral-400",
};

const LABEL: Record<Status, string> = {
  queued: "Queued",
  probing: "Sniffing",
  processing: "Pending",
  complete: "Ready",
  failed: "Failed",
  expired: "Expired",
};

/**
 * Marching dots. Motion means exactly one thing here — yt-dlp is running — so
 * only `probing` and `processing` get it. `queued` is a static circle because
 * nothing is happening yet: the job hasn't been picked up.
 *
 * Reuses `animate-blink` (1.2s) rather than earning its own token; the stagger
 * is doing most of the work.
 */
const Working = () => (
  <span className="flex shrink-0 gap-0.5" aria-hidden>
    {["0ms", "160ms", "320ms"].map((animationDelay) => (
      <span
        key={animationDelay}
        style={{ animationDelay }}
        className="size-0.5 animate-blink rounded-full bg-current"
      />
    ))}
  </span>
);

const MARKER: Record<Status, ReactNode> = {
  queued: <span className="size-1.5 shrink-0 rounded-full bg-current/70" aria-hidden />,
  probing: <Working />,
  processing: <Working />,
  // Lucide's default 2px stroke is tuned for 24px and reads lighter than the
  // 700-weight label beside it once shrunk — the same correction the table's
  // ArrowUpRight already makes at 2.25.
  complete: <Check className="size-2.5 shrink-0" strokeWidth={3.4} aria-hidden />,
  // Typed rather than drawn: "!" is ASCII, so unlike ✓/✕ it can't fall out of
  // the shipped font subset and silently reflow the tag. It also inherits the
  // label's weight and cap-height instead of needing its own alignment.
  failed: (
    <span className="shrink-0 -translate-y-[0.5px] tracking-normal" aria-hidden>
      !
    </span>
  ),
  // Imported rather than redrawn like the checkmark above: the fade —
  // dashes trailing off around the rim — is the whole point of the shape,
  // so it needs Lucide's own path rather than a filled silhouette that
  // would flatten it back into a plain clock.
  expired: <ClockFading className="size-2.5 shrink-0" strokeWidth={2.5} aria-hidden />,
};

export function DownloadStatus({
  status,
  scramble = false,
  className,
}: {
  status: Status;
  /**
   * Replays the character scramble on every transition. The rail only: it's a
   * feature when one status changes three times while you watch it, and
   * unreadable when ten rows poll at once.
   */
  scramble?: boolean;
  className?: string;
}) {
  const label = LABEL[status];

  return (
    <span
      className={cn(
        // Written as an explicit color-mix rather than `bg-current/14`.
        // Tailwind can't precompute an alpha hex for currentColor, so it
        // emits an unguarded `background-color: currentColor` beneath the
        // @supports block — which in a browser without color-mix would paint
        // the tag solid in the same colour as its own label. This degrades to
        // no fill instead, which is merely plainer rather than unreadable.
        "inline-flex h-[22px] items-center gap-1.5 rounded-[4px] px-2",
        "bg-[color-mix(in_srgb,currentColor_14%,transparent)]",
        "font-mono text-[10.5px] font-bold tracking-[0.14em] uppercase",
        TONE[status],
        className,
      )}
    >
      {MARKER[status]}
      {scramble ? (
        // keyed so the scramble replays on every transition
        <DecryptedText key={status} text={label} speed={45} />
      ) : (
        label
      )}
    </span>
  );
}
