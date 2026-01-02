import type { TerminalLine } from "../AnimatedTerminal/types";

export function createTerminalLine(
  text: string,
  options: Partial<Omit<TerminalLine, "text">> = {},
): TerminalLine {
  return {
    prefix: "",
    animate: false,
    ...options,
    text,
  };
}

export function createCommandLine(command: string): TerminalLine {
  return {
    prefix: "$",
    text: command,
    animate: true,
  };
}

export function createInfoLine(text: string): TerminalLine {
  return {
    prefix: "",
    text: `info: ${text}`,
    className: "text-cyan-400",
    delay: 200,
    animate: false,
  };
}

export function createErrorLine(text: string): TerminalLine {
  return {
    prefix: "",
    text,
    className: "text-red-400",
    delay: 50,
    animate: false,
  };
}

export function createEmptyLine(delay = 150): TerminalLine {
  return {
    prefix: "",
    text: "",
    delay,
    animate: false,
  };
}
