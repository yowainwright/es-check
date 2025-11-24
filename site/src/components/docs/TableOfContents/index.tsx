import React, { useEffect, useState } from "react";
import type { TableOfContentsProps, Heading } from "./types";
import { OBSERVER_OPTIONS } from "./constants";

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
}) => {
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

  const renderHeading = (heading: Heading) => {
    const isActive = activeId === heading.slug;
    const linkClassName = `text-sm transition font-outfit ${
      isActive ? "text-primary font-semibold" : "hover:text-primary"
    }`;
    const hasSubheadings =
      heading.subheadings && heading.subheadings.length > 0;
    const subheadingItems = hasSubheadings
      ? heading.subheadings.map((subheading) => renderHeading(subheading))
      : null;

    return (
      <li key={heading.slug} className="mb-4">
        <a href={`#${heading.slug}`} className={linkClassName}>
          {heading.text}
        </a>
        {hasSubheadings && <ul className="ml-4 mt-2">{subheadingItems}</ul>}
      </li>
    );
  };

  const headingItems = headings.map((heading) => renderHeading(heading));

  return (
    <div className="hidden xl:sticky xl:block xl:top-28">
      <h1 className="mb-4 text-xl font-bold font-outfit">On this page</h1>
      <ul>{headingItems}</ul>
    </div>
  );
};
