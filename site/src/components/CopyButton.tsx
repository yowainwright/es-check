import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const container = e.currentTarget.closest("div");
    const codeElement = container?.querySelector("code");

    if (!codeElement) return;

    const text = codeElement.textContent || "";

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    });
  }, []);

  return (
    <button
      className={`btn btn-ghost btn-square rounded-s-none min-w-[44px] min-h-[44px] ${copied ? "text-success" : ""}`}
      onClick={handleCopy}
      aria-label="Copy"
      disabled={copied}
    >
      {copied ? (
        <Check className="h-5 w-5 md:h-6 md:w-6" />
      ) : (
        <Copy className="h-5 w-5 md:h-6 md:w-6" />
      )}
    </button>
  );
}
