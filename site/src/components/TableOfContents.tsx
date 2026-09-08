import { useEffect, useState, type RefObject } from "react";
import type { Heading } from "@/lib/mdx/compileMDX";
export type { Heading } from "@/lib/mdx/compileMDX";

interface TableOfContentsProps {
  headings: Heading[];
  articleRef: RefObject<HTMLDivElement | null>;
}

const HEADING_OFFSET = 96;
const INDENTS: Record<number, string> = { 2: "", 3: "pl-3", 4: "pl-6" };

export function getActiveHeadingId(
  positions: { id: string; top: number }[],
  atBottom = false,
): string {
  const lastId = positions.at(-1)?.id ?? "";
  if (atBottom) return lastId;
  const passed = positions.filter((heading) => heading.top <= HEADING_OFFSET);
  const activeId = passed.at(-1)?.id ?? positions[0]?.id ?? "";
  return activeId;
}

export function TableOfContents({ headings, articleRef }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const elements = headings.map((heading) => document.getElementById(heading.slug));
    const targets = elements.filter(
      (element): element is HTMLElement => element !== null && article.contains(element),
    );
    const update = () => {
      const positions = targets.map((element) => ({
        id: element.id,
        top: element.getBoundingClientRect().top,
      }));
      const pageHeight = document.documentElement.scrollHeight;
      const atBottom =
        pageHeight > window.innerHeight && window.scrollY + window.innerHeight >= pageHeight - 2;
      setActiveId(getActiveHeadingId(positions, atBottom));
    };
    return watchArticle(article, update);
  }, [headings, articleRef]);

  return (
    <nav aria-label="On this page" className="font-sans">
      <h2 className="mb-4 text-sm font-semibold">On this page</h2>
      <ul className="space-y-1 border-l border-base-content/15">
        {headings.map((heading) => (
          <HeadingItem key={heading.slug} heading={heading} activeId={activeId} />
        ))}
      </ul>
    </nav>
  );
}

function watchArticle(article: HTMLElement, update: () => void) {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(article);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("hashchange", schedule);
  };
}

function HeadingItem({ heading, activeId }: { heading: Heading; activeId: string }) {
  const isActive = activeId === heading.slug;
  const linkClass = isActive
    ? "border-primary text-primary font-semibold bg-primary/5"
    : "border-transparent text-base-content/70 hover:text-primary";
  const indent = INDENTS[heading.depth] ?? "";

  return (
    <li className={indent}>
      <a
        href={`#${heading.slug}`}
        aria-current={isActive ? "location" : undefined}
        className={`-ml-px block border-l-2 py-2 pl-3 pr-2 text-sm break-words transition-colors ${linkClass}`}
      >
        {heading.text}
      </a>
    </li>
  );
}
