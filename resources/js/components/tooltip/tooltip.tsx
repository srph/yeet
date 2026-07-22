import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({
  children,
  delay = 300,
  ...props
}: ComponentProps<typeof BaseTooltip.Provider>) {
  return (
    <BaseTooltip.Provider delay={delay} {...props}>
      {children}
    </BaseTooltip.Provider>
  );
}

type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: ComponentProps<typeof BaseTooltip.Positioner>["side"];
  sideOffset?: number;
  className?: string;
};

export function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 6,
  className,
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={side}
          sideOffset={sideOffset}
          className="z-50 outline-none"
        >
          <BaseTooltip.Popup
            className={cn(
              "rounded-md bg-neutral-800 px-2 py-1 font-sans text-[11px] font-medium tracking-normal text-neutral-200 shadow-lg outline-none",
              "origin-(--transform-origin) transition data-starting-style:opacity-0 data-ending-style:opacity-0",
              className,
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
