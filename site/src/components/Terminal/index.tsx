import type { TerminalProps } from "./types";
import { TERMINAL } from "./constants";

export function Terminal({
  children,
  id,
  title = "terminal",
  height,
  width,
  className = "",
}: TerminalProps) {
  const style = {
    ...(height ? { height } : {}),
    ...(width ? { width } : {}),
  };

  return (
    <div id={id} className={`${TERMINAL.container} ${className}`} style={style}>
      <div className={TERMINAL.header}>
        <div className={TERMINAL.trafficLights}>
          <span className={`${TERMINAL.trafficLight} ${TERMINAL.close}`} />
          <span className={`${TERMINAL.trafficLight} ${TERMINAL.minimize}`} />
          <span className={`${TERMINAL.trafficLight} ${TERMINAL.maximize}`} />
        </div>
        <span className={TERMINAL.title}>{title}</span>
      </div>
      <div className={TERMINAL.content}>{children}</div>
    </div>
  );
}

export type { TerminalProps } from "./types";
