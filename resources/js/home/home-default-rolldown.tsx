import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { useInterval } from "../hooks/use-interval";

const sources = ["YouTube", "X", "Facebook", "TikTok", "Douyin"] as const;

export function HomeDefaultRolldown() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [measureRef, bounds] = useMeasure();

  useInterval(() => {
    setSourceIndex((index) => (index + 1) % sources.length);
  }, 3000);

  return (
    <div className="text-center text-2xl leading-none text-neutral-500">
      Download videos from{" "}
      <motion.span
        animate={{ width: bounds.width || "auto" }}
        className="inline-block overflow-hidden align-bottom whitespace-nowrap"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={sources[sourceIndex]}
            ref={measureRef}
            className="inline-block"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            {sources[sourceIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </div>
  );
}
