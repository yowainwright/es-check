import type { TerminalProps } from "./types";

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
    <div id={id} className={`terminal ${className}`} style={style}>
      <div className="terminal-header">
        <div className="terminal-traffic-lights">
          <span className="terminal-traffic-light terminal-traffic-light--close" />
          <span className="terminal-traffic-light terminal-traffic-light--minimize" />
          <span className="terminal-traffic-light terminal-traffic-light--maximize" />
        </div>
        <span className="terminal-title">{title}</span>
      </div>
      <div className="terminal-content">{children}</div>
    </div>
  );
}

export type { TerminalProps } from "./types";
