import React, { useState } from "react";

export const CopyButton = () => {
  const [isClicked, setIsClicked] = useState(false);

  const handleCopy = (e) => {
    const target = e.currentTarget;
    const codeElement = target.closest("div").querySelector("code");

    if (!codeElement) {
      console.log("Code not found");
      return;
    }

    const code = codeElement.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setIsClicked(true);
          target.disabled = true;
          setTimeout(() => {
            setIsClicked(false);
            target.disabled = false;
          }, 800);
        })
        .catch((error) => {
          console.error("Failed to save text to clipboard:", error);
        });
    } else {
      console.error("Clipboard API is not supported");
    }
  };

  return (
    <button
      className="btn btn-ghost btn-square rounded-s-none min-w-[44px] min-h-[44px]"
      onClick={handleCopy}
      aria-label="Copy"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:h-6 md:w-6 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isClicked ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
          />
        )}
      </svg>
    </button>
  );
};
