import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text?: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      let content = text;

      if (!content) {
        const container = e.currentTarget.closest("div");
        const codeElement = container?.querySelector("code");
        content = codeElement?.textContent || "";
      }

      if (!content) return;

      navigator.clipboard.writeText(content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 800);
      });
    },
    [text]
  );

  return (
    <button
      className={`btn btn-ghost btn-sm btn-square rounded-md ${copied ? "text-success" : ""} ${className}`}
      onClick={handleCopy}
      aria-label="Copy"
      disabled={copied}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
