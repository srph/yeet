import { useState } from "react";
import Scritto from "@scritto/react";
import { useInterval } from "../hooks/use-interval";
import { SOURCE_LIST } from "@/sources";

const HOLD_MS = 3000;

/**
 * What the headline offers to download. Rolls in lockstep with the source, so
 * every tick swaps both. Kept to plurals that read after "Download" and stay
 * true for mp3 and mp4 alike.
 */
const NOUNS = [
  "videos",
  "memes",
  "clips",
  "songs",
  "reels",
  "edits",
  "podcasts",
  "shitposts",
];

/**
 * Stable sentence for screen readers, so the rotation isn't read as churn.
 * Says "videos" whatever the visible noun is — the noun is flavour, not info.
 */
const SPOKEN = `Download videos from ${SOURCE_LIST.slice(0, -1)
  .map((source) => source.label)
  .join(", ")} and ${SOURCE_LIST[SOURCE_LIST.length - 1].label}`;

export function HomeDefaultHeadline() {
  // One counter drives both lists. They differ in length (8 and 5), so the
  // pairings drift each lap and only repeat after 40 ticks.
  const [tick, setTick] = useState(0);

  useInterval(() => {
    setTick((tick) => tick + 1);
  }, HOLD_MS);

  const noun = NOUNS[tick % NOUNS.length];
  const source = SOURCE_LIST[tick % SOURCE_LIST.length];

  return (
    <h1 className="text-center text-[clamp(32px,7vw,48px)] font-extrabold leading-[1.125] tracking-tighter text-white">
      <span className="sr-only">{SPOKEN}</span>

      <span aria-hidden="true">
        {/* Each flow is what keeps the static word on the same clock as the
            rolling one beside it — without it the line re-centres in one
            frame while the glyphs are still rolling. */}
        <scritto-flow className="block">
          Download <Scritto value={noun} />
        </scritto-flow>

        <scritto-flow className="block">
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
