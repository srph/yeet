import * as React from "react";

import { cn } from "@/lib/utils";

const CHIP_FACE =
  "inline-flex select-none items-center rounded-full bg-neutral-700 px-3 py-1 text-xs font-bold";

function ChipToggleButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="chip-toggle-button"
      className={cn(
        CHIP_FACE,
        "transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Same pill face as the toggle, minus the interactive states — for contexts
 * (the dashboard table) that display a format rather than let you pick one.
 */
function ChipBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip-badge"
      className={cn(CHIP_FACE, className)}
      {...props}
    />
  );
}

export { ChipToggleButton, ChipBadge };
