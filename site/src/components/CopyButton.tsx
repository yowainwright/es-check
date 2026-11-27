import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  }

  return (
    <button
      className={`btn btn-ghost btn-sm btn-square rounded-md ${copied ? "text-success" : ""} ${className}`}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy command"}
      disabled={copied}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
