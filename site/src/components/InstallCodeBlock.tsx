import { CopyButton } from "./CopyButton";

const INSTALL_COMMAND = "npm i es-check --save-dev";

export function InstallCodeBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between bg-base-300 rounded-lg shadow-sm overflow-hidden h-12 border border-base-content/10 ${className}`}
    >
      <div className="flex items-center">
        <ChevronIcon />
        <code className="text-left leading-none text-sm md:text-base whitespace-nowrap">
          {INSTALL_COMMAND}
        </code>
      </div>
      <CopyButton text={INSTALL_COMMAND} className="mr-2" />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="22"
      height="13"
      viewBox="0 0 22 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative ml-4 mr-2 block w-3 flex-shrink-0 -rotate-90"
    >
      <path d="M1 1L11 11L21 1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
