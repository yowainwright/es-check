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

    return (
      <li key={heading.slug} className="mb-4">
        <a
          href={`#${heading.slug}`}
          className={`text-sm transition font-outfit ${
            isActive ? "text-primary font-semibold" : "hover:text-primary"
          }`}
        >
          {heading.text}
        </a>
        {heading.subheadings && heading.subheadings.length > 0 && (
          <ul className="ml-4 mt-2">
            {heading.subheadings.map((subheading) => renderHeading(subheading))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="hidden xl:sticky xl:block xl:top-28">
      <h1 className="mb-4 text-xl font-bold font-outfit">On this page</h1>
      <ul>{headings.map((heading) => renderHeading(heading))}</ul>
    </div>
  );
};
