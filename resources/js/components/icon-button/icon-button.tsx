import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

function IconButton({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="icon-button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-blue-200 text-blue-950 transition-colors hover:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { IconButton };
