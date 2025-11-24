import { useState, useEffect } from "react";
import type { TerminalLine } from "./types";
import { DEFAULT_ANIMATE, DEFAULT_LINE_DELAY } from "./constants";

export const useLineProcessor = (
  currentLine: TerminalLine | undefined,
  visibleLines: TerminalLine[],
  onLineComplete: () => void,
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentLine) return;

    const shouldAnimate = currentLine.animate ?? DEFAULT_ANIMATE;
    const lineDelay = currentLine.delay ?? DEFAULT_LINE_DELAY;

    if (!shouldAnimate) {
      const timer = setTimeout(() => {
        onLineComplete();
      }, lineDelay);
      return () => clearTimeout(timer);
    }

    const startTimer = setTimeout(() => {
      setIsTyping(true);
    }, lineDelay);

    return () => clearTimeout(startTimer);
  }, [currentLine, onLineComplete]);

  return { isTyping, setIsTyping };
};
