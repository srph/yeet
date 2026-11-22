import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A bare text trigger — just the current label and a caret — that opens a
 * small popup of options. No field chrome, so it sits in a heading row like a
 * word rather than a control.
 */

type SelectOption<Value extends string> = { value: Value; label: string };

type SelectProps<Value extends string> = {
  value: Value;
  onValueChange: (value: Value) => void;
  options: readonly SelectOption<Value>[];
  "aria-label": string;
  className?: string;
};

function Select<Value extends string>({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
}: SelectProps<Value>) {
  return (
    <BaseSelect.Root
      value={value}
      // Single-select never hands back null unless something clears it, but
      // the type allows it — ignore it so there's always a label to show.
      onValueChange={(next) => next !== null && onValueChange(next)}
      items={options}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group inline-flex cursor-pointer select-none h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold tracking-[-0.01em] text-neutral-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 data-popup-open:text-white",
          className,
        )}
      >
        <BaseSelect.Value />
        <BaseSelect.Icon className="text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 group-data-popup-open:rotate-180 group-data-popup-open:text-neutral-300">
          <ChevronDown size={13} strokeWidth={2.25} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <BaseSelect.Popup className="min-w-32 origin-(--transform-origin) rounded-lg border border-neutral-800 bg-neutral-900 p-1 shadow-lg outline-none transition data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs font-medium text-neutral-300 outline-none data-highlighted:bg-neutral-800 data-highlighted:text-white data-selected:text-white"
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-neutral-400">
                    <Check size={12} strokeWidth={2.5} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

export { Select, type SelectOption };
