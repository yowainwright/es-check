import { useState, useEffect } from "react";

export function useTypingAnimation(
  text: string,
  speed: number,
  isActive: boolean,
) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isActive) {
      setDisplayedText("");
      return;
    }

    const currentLength = displayedText.length;

    if (currentLength < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentLength + 1));
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [isActive, displayedText, text, speed]);

  const isComplete = displayedText.length === text.length && text.length > 0;

  return { displayedText, isComplete };
}
