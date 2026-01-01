import { useState, useEffect, useCallback, useRef } from "react";
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

export function AnimatedTerminal({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  height,
  width,
  title = "cli",
}: AnimatedTerminalProps) {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedLinesRef = useRef<Set<number>>(new Set());

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
    processedLinesRef.current.clear();
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

    if (currentLine && !processedLinesRef.current.has(currentLineIndex)) {
      processedLinesRef.current.add(currentLineIndex);
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
    moveToNextLine
  );

  const { displayedText, isComplete } = useTypingAnimation(
    currentLine?.text ?? "",
    typingSpeed,
    isTyping
  );

  useEffect(() => {
    if (isComplete && isTyping) {
      setIsTyping(false);
      moveToNextLine();
    }
  }, [isComplete, isTyping, moveToNextLine, setIsTyping]);

  const containerStyle = {
    ...(height ? { height } : {}),
    ...(width ? { width } : {}),
  };

  return (
    <div ref={containerRef} className={TERMINAL_CLASSES} style={containerStyle} data-prefix=" ">
      <span className="terminal-header">{title}</span>
      {visibleLines.map((line, index) => (
        <pre key={index} data-prefix={line.prefix ?? ""} className={line.className ?? ""}>
          <code dangerouslySetInnerHTML={{ __html: line.text }} />
        </pre>
      ))}
      {isTyping && currentLine && (
        <pre data-prefix={currentLine.prefix ?? ""} className={currentLine.className ?? ""}>
          <code>
            <span dangerouslySetInnerHTML={{ __html: displayedText }} />
            <span className="cursor" />
          </code>
        </pre>
      )}
    </div>
  );
}

export type { AnimatedTerminalProps, TerminalDemo, TerminalLine } from "./types";
