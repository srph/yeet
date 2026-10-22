import { Children, type ComponentProps } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import "./metal-button.css";

export function MetalButton({
  children,
  className,
  disabled = false,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      data-slot="metal-button"
      type={type}
      disabled={disabled}
      className={cn(
        "metal-button relative isolate inline-flex h-11 min-h-8 select-none items-center justify-center overflow-hidden rounded-full px-6 text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <span className="metal-button__surface" aria-hidden="true">
        <span className="metal-button__base" />
        <span className="metal-button__swirls">
          <span />
          <span />
        </span>
        <span className="metal-button__gloss" />
        <span className="metal-button__light">
          <span className="metal-button__base" />
          <span className="metal-button__swirls">
            <span />
            <span />
          </span>
          <span className="metal-button__gloss" />
          <motion.span
            className="metal-button__glint"
            initial={false}
            animate={{ left: disabled ? "-40%" : "110%" }}
            transition={{
              duration: disabled ? 0 : 0.95,
              delay: disabled ? 0 : 0.3,
              ease: [0.45, 0, 0.55, 1],
            }}
          />
        </span>
      </span>
      <span className="relative inline-flex items-center justify-center gap-2.5">
        {Children.map(children, (child) =>
          typeof child === "string" || typeof child === "number" ? (
            <span className="inline-flex">
              <span className="sr-only">{child}</span>
              <span className="metal-button__roll" aria-hidden="true">
                {Array.from(String(child), (character, index) => (
                  <span
                    key={index}
                    className="metal-button__letter"
                    style={{ transitionDelay: `${index * 16}ms` }}
                  >
                    <span>{character}</span>
                    <span className="metal-button__letter-copy">
                      {character}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          ) : (
            child
          ),
        )}
      </span>
    </button>
  );
}
