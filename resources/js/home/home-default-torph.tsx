import { useState } from "react";
import { TextMorph } from "torph/react";
import { useInterval } from "../hooks/use-interval";
import { SOURCE_LIST } from "@/sources";

const sources = SOURCE_LIST;

const HOLD_MS = 3000;

/** Stable sentence for screen readers, so the rotation isn't read as churn. */
const SPOKEN = `Download videos from ${sources
  .slice(0, -1)
  .map((source) => source.label)
  .join(", ")} and ${sources[sources.length - 1].label}`;

export function HomeDefaultTorph() {
  const [sourceIndex, setSourceIndex] = useState(0);

  useInterval(() => {
    setSourceIndex((index) => (index + 1) % sources.length);
  }, HOLD_MS);

  const source = sources[sourceIndex];

  return (
    <h1 className="text-center text-[clamp(32px,7vw,48px)] font-extrabold leading-[1.125] text-white">
      <span className="sr-only">{SPOKEN}</span>

      <span aria-hidden="true">
        <span className="block">Download videos</span>

        <span className="flex items-baseline justify-center gap-[0.26em]">
          <span>from</span>
          <TextMorph
            className={`inline-block whitespace-nowrap text-left ${source.text}`}
            style={{ textAlign: "left" }}
          >
            {source.label}
          </TextMorph>
        </span>
      </span>
    </h1>
  );
}
