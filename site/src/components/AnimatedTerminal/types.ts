export interface TerminalLine {
  prefix?: string;
  text: string;
  className?: string;
  delay?: number;
  animate?: boolean;
}

export interface TerminalDemo {
  lines: TerminalLine[];
  pauseAfter?: number;
}

export interface AnimatedTerminalProps {
  demos: TerminalDemo[];
  loop?: boolean;
  typingSpeed?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export type CurrentLineData = {
  className?: string;
  prefix?: string;
};

export type CodeBlockProps = {
  isTyping: boolean;
  currentLine?: CurrentLineData;
  displayedText: string;
};
