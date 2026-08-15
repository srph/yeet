import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Ported from tenor-agent's `ui/layer-card` and re-tinted for this app's dark
 * shell. The layering there was two lightnesses apart from white (neutral-100
 * outer, white content) so the content box read as a raised sheet; here it's
 * the same relationship run in reverse — bg-neutral-900 outer, bg-neutral-800
 * content — since a surface reads as "closer" by going lighter, not darker,
 * once the page itself is dark. Outer and content share one radius so the
 * content box's corners land flush with the card's own when it reaches an
 * edge (see `LayerCardContent`).
 *
 * Example: <LayerCard><LayerCardSecondary>Title</LayerCardSecondary><LayerCardContent>Content</LayerCardContent></LayerCard>
 */
export function LayerCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-800 bg-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

// Super useful as heading or footer
export function LayerCardSecondary({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function LayerCardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg bg-neutral-800 p-4", className)}
      {...props}
    />
  );
}
