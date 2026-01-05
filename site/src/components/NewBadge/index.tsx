import { useEffect } from "react";
import { NewBadgeProps } from "./types";
import {
  BADGE_TEXT,
  BADGE_HREF,
  RAINBOW_GRADIENT,
  RAINBOW_ANIMATION,
  RAINBOW_KEYFRAMES,
} from "./constants";

export function NewBadge({ className = "" }: NewBadgeProps) {
  useEffect(() => {
    const styleId = "rainbow-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = RAINBOW_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <a
      className={`badge badge-outline badge-xs md:badge-lg mb-5 p-2 border-dashed border-base-content/40 ${className}`}
      href={BADGE_HREF}
    >
      <span
        className="font-semibold bg-clip-text text-transparent"
        style={{
          backgroundImage: RAINBOW_GRADIENT,
          ...RAINBOW_ANIMATION,
        }}
      >
        {BADGE_TEXT}
      </span>
    </a>
  );
}
