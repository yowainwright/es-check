import React, { useState, useEffect, useCallback, useRef } from "react";
import type { AnimatedTerminalProps, TerminalLine } from "./types";
import {
  DEFAULT_TYPING_SPEED,
  DEFAULT_LOOP,
  DEFAULT_PAUSE_DURATION,
  INTERSECTION_OBSERVER_OPTIONS,
  TERMINAL_CLASSES,
} from "./constants";
import { useTypingAnimation } from "./useTypingAnimation";
import { useLineProcessor } from "./useLineProcessor";

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  height,
  width,
}) => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDemo = demos[currentDemoIndex];
  const currentLine = currentDemo?.lines[currentLineIndex];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const isInView = entries[0]?.isIntersecting;
      if (isInView && !hasStarted) {
        setHasStarted(true);
      }
    }, INTERSECTION_OBSERVER_OPTIONS);

    const current = containerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasStarted]);

  const resetAnimation = useCallback(() => {
    setCurrentLineIndex(0);
    setVisibleLines([]);
  }, []);

  const moveToNextDemo = useCallback(() => {
    const isLastDemo = currentDemoIndex === demos.length - 1;

    if (isLastDemo && loop) {
      setCurrentDemoIndex(0);
      resetAnimation();
    } else if (!isLastDemo) {
      setCurrentDemoIndex(currentDemoIndex + 1);
      resetAnimation();
    }
  }, [currentDemoIndex, demos.length, loop, resetAnimation]);

  const moveToNextLine = useCallback(() => {
    const isLastLine = currentLineIndex === currentDemo.lines.length - 1;

    if (currentLine) {
      setVisibleLines((prev) => [...prev, currentLine]);
    }

    if (isLastLine) {
      const pauseDuration = currentDemo.pauseAfter ?? DEFAULT_PAUSE_DURATION;
      setTimeout(moveToNextDemo, pauseDuration);
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  }, [currentLineIndex, currentDemo, moveToNextDemo, currentLine]);

  const { isTyping, setIsTyping } = useLineProcessor(
    hasStarted ? currentLine : undefined,
    visibleLines,
    moveToNextLine,
  );

  const { displayedText, isComplete } = useTypingAnimation(
    currentLine?.text ?? "",
    typingSpeed,
    isTyping,
  );

  useEffect(() => {
    if (isComplete && isTyping) {
      setIsTyping(false);
      moveToNextLine();
    }
  }, [isComplete, isTyping, moveToNextLine, setIsTyping]);

  return (
    <div
      ref={containerRef}
      className={TERMINAL_CLASSES}
      style={{
        ...(height ? { height } : {}),
        ...(width ? { width } : {}),
      }}
      data-prefix=" "
    >
      {visibleLines.map((line, index) => (
        <pre
          key={index}
          data-prefix={line.prefix ?? ""}
          className={line.className ?? ""}
        >
          <code dangerouslySetInnerHTML={{ __html: line.text }} />
        </pre>
      ))}
      {isTyping && currentLine && (
        <pre
          data-prefix={currentLine.prefix ?? ""}
          className={currentLine.className ?? ""}
        >
          <code>
            <span dangerouslySetInnerHTML={{ __html: displayedText }} />
            <span className="cursor" />
          </code>
        </pre>
      )}
    </div>
  );
};
