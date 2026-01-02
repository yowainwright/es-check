export const TERMINAL = {
  container:
    "relative text-left rounded-lg border border-base-content/20 bg-base-200 overflow-hidden",
  header:
    "relative h-10 bg-base-300 border-b border-base-300 flex items-center justify-center",
  trafficLights: "absolute left-4 top-1/2 -translate-y-1/2 flex gap-2",
  trafficLight: "w-3 h-3 rounded-full",
  close: "bg-[#ff5f56]",
  minimize: "bg-[#ffbd2e]",
  maximize: "bg-[#27c93f]",
  title: "text-xs text-base-content/50",
  content: "terminal-content font-mono overflow-y-auto py-3 px-4",
  pre: "px-4 min-h-6 m-0 leading-6 block whitespace-pre overflow-x-auto md:text-base text-xs",
  cursor: "inline-block w-2 h-4 ml-0.5 bg-current animate-blink",
} as const;
