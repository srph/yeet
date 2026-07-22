import * as React from "react";

import { cn } from "@/lib/utils";

function ChipToggleButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="chip-toggle-button"
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-700 px-3 py-1 text-xs font-bold transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200",
        className,
      )}
      {...props}
    />
  );
}

export { ChipToggleButton };
