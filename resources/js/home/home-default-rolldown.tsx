import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { useInterval } from "../hooks/use-interval";
import { SOURCE_LIST } from "@/sources";

const sources = SOURCE_LIST;

export function HomeDefaultRolldown() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [measureRef, bounds] = useMeasure();

  useInterval(() => {
    setSourceIndex((index) => (index + 1) % sources.length);
  }, 3000);

  return (
    <h1 className="text-center text-[clamp(32px,7vw,48px)] leading-[1.08] font-semibold tracking-[-0.04em] text-white">
      <span className="block">Download videos</span>

      {/* Its own flex line: the width animation would otherwise rewrap the
          whole headline, and popLayout's absolute exit needs stable geometry.
          The offsets are percentages so they scale with the clamped size. */}
      <span className="flex items-baseline justify-center gap-[0.26em]">
        <span>from</span>
        <motion.span
          animate={{ width: bounds.width || "auto" }}
          className="inline-block overflow-hidden whitespace-nowrap"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={sources[sourceIndex].label}
              ref={measureRef}
              className={`inline-block ${sources[sourceIndex].text}`}
              initial={{ y: "60%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-60%", opacity: 0 }}
            >
              {sources[sourceIndex].label}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </span>
    </h1>
  );
}
