import { useEffect, useEffectEvent } from "react";

export function useInterval(callback: () => void, delay: number | null) {
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => onTick(), delay);

    return () => clearInterval(id);
  }, [delay]);
}
