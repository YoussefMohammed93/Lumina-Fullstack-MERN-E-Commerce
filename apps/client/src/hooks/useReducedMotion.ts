import { useMediaQuery } from "./useOverlay";

/** Honours the OS "reduce motion" preference for fades and transforms. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
