import { useCallback, useEffect, useSyncExternalStore } from "react";

/** Locks body scroll while an overlay (drawer, menu, search) is open. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [locked]);
}

/** Reports whether the viewport is at or above `query` (default md: 768px). */
export function useMediaQuery(query = "(min-width: 768px)"): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
