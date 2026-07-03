"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns { ref, inView }.
 * Sets inView = true once the element enters the viewport and stays true.
 * Use `inView` to drive conditional class names / styles in components.
 */
export function useInView(threshold = 0.08) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true); // SSR / no-support fallback
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/**
 * useScrollReveal — legacy compat wrapper for sections that use
 * the `cc-section-hidden` → `cc-section-visible` CSS class swap.
 * Uses querySelectorAll ONCE on mount; works for static DOM trees.
 */
export function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = el.dataset.revealDelay ?? "";
          el.classList.remove("cc-section-hidden");
          el.classList.add(
            "cc-section-visible",
            ...(delay ? [`cc-section-visible-d${delay}`] : [])
          );
          observer.unobserve(el);
        });
      },
      { threshold }
    );

    // Observe root + all children with cc-section-hidden at mount time
    const targets = [
      node,
      ...Array.from(node.querySelectorAll<HTMLElement>(".cc-section-hidden")),
    ];
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
