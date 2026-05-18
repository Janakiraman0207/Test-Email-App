import { useEffect, useRef } from "react";

export const useToolbarScrollHint = (ref) => {
  const hasShownHint = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;

    hasShownHint.current = true;

    const timer = setTimeout(() => {
      el.scrollTo({ left: 80, behavior: "smooth" });

      const backTimer = setTimeout(() => {
        el.scrollTo({ left: 0, behavior: "smooth" });
      }, 1000);

      return () => clearTimeout(backTimer);
    }, 700);

    return () => clearTimeout(timer);
  }, [ref]);
};