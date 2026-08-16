import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-blue-200 text-blue-950 hover:bg-blue-300 disabled:border disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600 disabled:hover:bg-transparent",
        outline:
          "border-2 border-neutral-800 bg-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-50",
      },
      size: {
        xs: "h-6 gap-1.5 px-3 text-xs font-bold tracking-[-0.01em]",
        md: "h-8 gap-2 px-4 text-[13px] font-semibold tracking-[-0.02em]",
        lg: "h-11 gap-2.5 px-6 text-[14.5px] font-semibold tracking-[-0.02em]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
