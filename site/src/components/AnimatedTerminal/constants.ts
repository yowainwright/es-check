import type { TerminalDemo } from "./types";

export const DEFAULT_TYPING_SPEED = 30;
export const DEFAULT_LOOP = true;
export const DEFAULT_PAUSE_DURATION = 3000;
export const DEFAULT_ANIMATE = true;
export const DEFAULT_LINE_DELAY = 0;

export const INTERSECTION_OBSERVER_OPTIONS = {
  threshold: 0.1,
};

export const LINE_STYLES = {
  info: "text-cyan-400",
  success: "text-success",
  error: "text-red-400",
  divider: "opacity-50",
} as const;

export const ES_CHECK_DEMO: TerminalDemo[] = [
  {
    lines: [
      {
        prefix: "$",
        text: "npx es-check es5 './dist/*.js'",
        animate: true,
      },
      {
        prefix: "",
        text: "info: ES-Check: checking 24 files...",
        className: LINE_STYLES.info,
        delay: 200,
        animate: false,
      },
      {
        prefix: "",
        text: "info: ✓ ES-Check passed!",
        className: LINE_STYLES.success,
        delay: 300,
        animate: false,
      },
      { prefix: "", text: "", delay: 150, animate: false },
      {
        prefix: "$",
        text: "npx es-check es5 './build/*.js'",
        animate: true,
        delay: 150,
      },
      {
        prefix: "",
        text: "info: ES-Check: checking 3 files...",
        className: LINE_STYLES.info,
        delay: 200,
        animate: false,
      },
      {
        prefix: "",
        text: "error: ES-Check: there were 2 errors.",
        className: LINE_STYLES.error,
        delay: 300,
        animate: false,
      },
      { prefix: "", text: "", delay: 50, animate: false },
      {
        prefix: "",
        text: "ES-Check Error:",
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "----",
        className: LINE_STYLES.divider,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "· file: ./build/app.js",
        className: LINE_STYLES.error,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "· SyntaxError: Unexpected token (12:15)",
        className: LINE_STYLES.error,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "----",
        className: LINE_STYLES.divider,
        delay: 50,
        animate: false,
      },
      { prefix: "", text: "", delay: 100, animate: false },
      {
        prefix: "",
        text: "ES-Check Error:",
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "----",
        className: LINE_STYLES.divider,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "· file: ./build/utils.js",
        className: LINE_STYLES.error,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "· SyntaxError: 'const' is reserved (8:0)",
        className: LINE_STYLES.error,
        delay: 50,
        animate: false,
      },
      {
        prefix: "",
        text: "----",
        className: LINE_STYLES.divider,
        delay: 50,
        animate: false,
      },
    ],
    pauseAfter: 3000,
  },
];
