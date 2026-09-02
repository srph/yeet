import { useState } from "react";
import Scritto from "@scritto/react";
import { useInterval } from "../hooks/use-interval";
import { SOURCE_LIST } from "@/sources";

const HOLD_MS = 3000;

/** Stable sentence for screen readers, so the rotation isn't read as churn. */
const SPOKEN = `Download videos from ${SOURCE_LIST.slice(0, -1)
  .map((source) => source.label)
  .join(", ")} and ${SOURCE_LIST[SOURCE_LIST.length - 1].label}`;

export function HomeDefaultHeadline() {
  const [sourceIndex, setSourceIndex] = useState(0);

  useInterval(() => {
    setSourceIndex((index) => (index + 1) % SOURCE_LIST.length);
  }, HOLD_MS);

  const source = SOURCE_LIST[sourceIndex];

  return (
    <h1 className="text-center text-[clamp(32px,7vw,48px)] font-extrabold leading-[1.125] tracking-tighter text-white">
      <span className="sr-only">{SPOKEN}</span>

      <span aria-hidden="true">
        <span className="block">Download videos</span>

        {/* The flow is what keeps "from" on the same clock as the name beside
            it — without it the line re-centres in one frame while the glyphs
            are still rolling. */}
        <scritto-flow>
          from{" "}
          <Scritto
            value={source.label}
            className={`transition-colors duration-300 ${source.text}`}
          />
        </scritto-flow>
      </span>
    </h1>
  );
}
