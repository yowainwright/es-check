import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TerminalLine {
  prefix?: string;
  text: string;
  className?: string;
  delay?: number;
  animate?: boolean;
}

interface TerminalDemo {
  lines: TerminalLine[];
  pauseAfter?: number;
}

interface AnimatedTerminalProps {
  demos: TerminalDemo[];
  loop?: boolean;
  typingSpeed?: number;
  height?: string;
  width?: string;
}

const useTypingAnimation = (
  text: string,
  speed: number,
  isActive: boolean
) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      return;
    }

    const currentLength = displayedText.length;

    if (currentLength < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentLength + 1));
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [isActive, displayedText, text, speed]);

  const isComplete = displayedText.length === text.length && text.length > 0;

  return { displayedText, isComplete };
};

const useLineProcessor = (
  currentLine: TerminalLine | undefined,
  visibleLines: TerminalLine[],
  onLineComplete: () => void
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentLine) return;

    const shouldAnimate = currentLine.animate ?? true;
    const lineDelay = currentLine.delay ?? 0;

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

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  demos,
  loop = true,
  typingSpeed = 30,
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
    const observer = new IntersectionObserver(
      (entries) => {
        const isInView = entries[0]?.isIntersecting;
        if (isInView && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

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
      setVisibleLines(prev => [...prev, currentLine]);
    }

    if (isLastLine) {
      const pauseDuration = currentDemo.pauseAfter ?? 3000;
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
    currentLine?.text ?? '',
    typingSpeed,
    isTyping
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
      className="mockup-code bg-base-300 text-base-content max-w-3xl w-full mx-auto my-8"
      style={{
        ...(height ? { height } : {}),
        ...(width ? { width } : {})
      }}
      data-prefix=" "
    >
      {visibleLines.map((line, index) => (
        <pre
          key={index}
          data-prefix={line.prefix ?? ''}
          className={line.className ?? ''}
        >
          <code dangerouslySetInnerHTML={{ __html: line.text }} />
        </pre>
      ))}
      {isTyping && currentLine && (
        <pre
          data-prefix={currentLine.prefix ?? ''}
          className={currentLine.className ?? ''}
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
