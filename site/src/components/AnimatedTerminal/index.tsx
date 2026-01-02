import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AnimatedTerminalProps,
  TerminalLine,
  CodeBlockProps,
} from "./types";
import {
  DEFAULT_TYPING_SPEED,
  DEFAULT_LOOP,
  DEFAULT_PAUSE_DURATION,
  INTERSECTION_OBSERVER_OPTIONS,
} from "./constants";
import { useTypingAnimation } from "./useTypingAnimation";
import { useLineProcessor } from "./useLineProcessor";

export function AnimatedTerminal({
  demos,
  loop = DEFAULT_LOOP,
  typingSpeed = DEFAULT_TYPING_SPEED,
  onComplete,
  autoStart = true,
}: AnimatedTerminalProps) {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [hasStarted, setHasStarted] = useState(!autoStart);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedLinesRef = useRef<Set<number>>(new Set());

  const currentDemo = demos[currentDemoIndex];
  const currentLine = currentDemo?.lines[currentLineIndex];

  useEffect(() => {
    if (!autoStart) {
      setHasStarted(true);
      return;
    }

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
  }, [hasStarted, autoStart]);

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
    } else if (isLastDemo && onComplete) {
      onComplete();
    } else if (!isLastDemo) {
      setCurrentDemoIndex(currentDemoIndex + 1);
      resetAnimation();
    }
  }, [currentDemoIndex, demos.length, loop, resetAnimation, onComplete]);

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
    <div ref={containerRef}>
      {visibleLines.map(({ prefix = "", className = "", text }, index) => (
        <pre key={index} data-prefix={prefix} className={className}>
          <code dangerouslySetInnerHTML={{ __html: text }} />
        </pre>
      ))}
      <CodeBlock
        isTyping={isTyping}
        currentLine={currentLine}
        displayedText={displayedText}
      />
    </div>
  );
}

export const CodeBlock = ({
  isTyping,
  currentLine,
  displayedText,
}: CodeBlockProps) => {
  const isInactive = !isTyping || !currentLine;
  if (isInactive) return;
  const dataPrefix = currentLine.prefix ?? "";
  const className = currentLine.className ?? "";
  const text = { __html: displayedText };
  return (
    <pre data-prefix={dataPrefix} className={className}>
      <code>
        <span dangerouslySetInnerHTML={text} />
        <span className="cursor" />
      </code>
    </pre>
  );
};

export type {
  AnimatedTerminalProps,
  TerminalDemo,
  TerminalLine,
  CodeBlockProps,
} from "./types";
