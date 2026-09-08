import { useEffect, useRef, useState } from "react";

export function useScrollAnimation(threshold = 0.1, { once = true } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        const stopObserving = entry.isIntersecting && once;
        if (stopObserving) observer.unobserve(element);
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, isVisible };
}
