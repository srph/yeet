import { useState } from "react";
import { useInterval } from "./use-interval";

/** Wall-clock `now` that ticks on an interval (default 15s). */
export function useNow(interval = 15_000) {
  const [now, setNow] = useState(() => Date.now());

  useInterval(() => setNow(Date.now()), interval);

  return now;
}
