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
  height?: string;
  width?: string;
}
