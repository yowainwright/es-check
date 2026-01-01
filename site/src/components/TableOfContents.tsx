import { useEffect, useState } from "react";

export interface Heading {
  depth: number;
  slug: string;
  text: string;
  subheadings?: Heading[];
}

interface TableOfContentsProps {
  headings: Heading[];
}

const OBSERVER_OPTIONS = {
  rootMargin: "-100px 0px -66%",
  threshold: 1.0,
};

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, OBSERVER_OPTIONS);

    const headingElements = document.querySelectorAll("h2[id], h3[id], h4[id]");
    headingElements.forEach((element) => observer.observe(element));

    return () => {
      headingElements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  return (
    <div className="hidden xl:sticky xl:block xl:top-28">
      <h1 className="mb-4 text-xl font-bold font-outfit">On this page</h1>
      <ul>
        {headings.map((heading) => (
          <HeadingItem key={heading.slug} heading={heading} activeId={activeId} />
        ))}
      </ul>
    </div>
  );
}

function HeadingItem({ heading, activeId }: { heading: Heading; activeId: string }) {
  const isActive = activeId === heading.slug;
  const linkClass = isActive ? "text-primary font-semibold" : "hover:text-primary";
  const hasSubheadings = heading.subheadings && heading.subheadings.length > 0;

  return (
    <li className="mb-4">
      <a href={`#${heading.slug}`} className={`text-sm transition font-outfit ${linkClass}`}>
        {heading.text}
      </a>
      {hasSubheadings && (
        <ul className="ml-4 mt-2">
          {heading.subheadings!.map((subheading) => (
            <HeadingItem key={subheading.slug} heading={subheading} activeId={activeId} />
          ))}
        </ul>
      )}
    </li>
  );
}
