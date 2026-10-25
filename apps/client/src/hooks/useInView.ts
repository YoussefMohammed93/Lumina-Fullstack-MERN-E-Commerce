import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element enters the viewport. Used by <Reveal /> so
 * sections resolve into place instead of appearing statically.
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px", ...options },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}
