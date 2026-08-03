import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The selected pill is a single element parked at the group level rather than
 * one per item. The pressed item claims `anchor-name: --toggle-group-item`, the
 * pill pins all four of its insets to that anchor, and moving the name to
 * another item retargets those insets — which are ordinary animatable lengths,
 * so a plain `transition` slides *and* stretches the pill between items of
 * different widths. No JS, no measuring.
 *
 * `anchor-scope` on the container keeps the name from escaping, so two groups
 * on one page can't hand the pill to each other.
 *
 * Anchor positioning is Chrome 125+ / Safari 26+ / Firefox 147+ and there is
 * deliberately no fallback below that. Older browsers drop the inset
 * declarations, which collapses the pill to a 0×0 box that paints nothing —
 * the pressed item still reads through `data-pressed:text-white`.
 *
 * Single-select is Base UI's default, but it still lets you unpress the active
 * item down to `[]`. Nothing then owns the anchor and the pill vanishes, so a
 * caller that wants a permanently-filled group has to ignore the empty array.
 */

type ToggleGroupProps<Value extends string> = Omit<
  BaseToggleGroup.Props<Value>,
  "className" | "render"
> & {
  className?: string;
};

function ToggleGroup<Value extends string>({
  className,
  children,
  ...props
}: ToggleGroupProps<Value>) {
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      className={cn(
        "relative isolate inline-flex items-center rounded-full border border-neutral-800 p-0.5 [anchor-scope:--toggle-group-item]",
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        data-slot="toggle-group-indicator"
        className="pointer-events-none absolute z-0 rounded-full bg-neutral-800 transition-[top,right,bottom,left] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] [position-anchor:--toggle-group-item] [top:anchor(top)] [right:anchor(right)] [bottom:anchor(bottom)] [left:anchor(left)] motion-reduce:transition-none"
      />
    </BaseToggleGroup>
  );
}

type ToggleGroupItemProps<Value extends string> = Omit<
  Toggle.Props<Value>,
  "className" | "render" | "children" | "value"
> & {
  /** Required here, unlike bare `Toggle` — the group tracks items by value. */
  value: Value;
  className?: string;
  children?: ReactNode;
};

function ToggleGroupItem<Value extends string>({
  className,
  children,
  ...props
}: ToggleGroupItemProps<Value>) {
  return (
    <Toggle
      data-slot="toggle-group-item"
      className={cn(
        "relative z-10 cursor-pointer select-none rounded-full px-3.5 py-1 text-xs font-semibold tracking-[-0.01em] text-neutral-500 transition-colors hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 data-pressed:text-white data-pressed:[anchor-name:--toggle-group-item] data-disabled:cursor-not-allowed data-disabled:text-neutral-700",
        className,
      )}
      {...props}
    >
      {children}
    </Toggle>
  );
}

export { ToggleGroup, ToggleGroupItem };
