import { Link } from "@tanstack/react-router";
import { CopyButton } from "./CopyButton";

type PreProps = React.HTMLAttributes<HTMLPreElement> & { "data-command"?: string };

function Pre({ children, className, "data-command": command, ...props }: PreProps) {
  const padding = command ? "pr-16" : "";
  return (
    <div className="relative">
      <pre
        {...props}
        className={`overflow-x-auto p-4 rounded-lg border border-base-content/20 shadow-inner ${padding} ${className || ""}`}
      >
        {children}
      </pre>
      {command && (
        <div className="absolute top-2 right-2">
          <CopyButton text={command} />
        </div>
      )}
    </div>
  );
}

function Anchor({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");

  const isInternalPage = isInternal && href && !href.startsWith("#");
  if (isInternalPage) {
    return (
      <Link to={href} className="text-primary hover:underline" {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="text-primary hover:underline"
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noopener noreferrer"}
      {...props}
    >
      {children}
    </a>
  );
}

function Heading2({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 id={id} className="group scroll-mt-24" {...props}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </h2>
  );
}

function Heading3({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 id={id} className="group scroll-mt-24" {...props}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </h3>
  );
}

function Heading4({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 id={id} className="group scroll-mt-24" {...props}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </h4>
  );
}

function ReleaseSummary({ children }: { children: React.ReactNode }) {
  return (
    <aside
      aria-label="Section summary"
      className="not-prose rounded-lg border border-base-content/15 p-6 text-xs leading-relaxed text-base-content/80 [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-base-content [&_a]:mt-3 [&_a]:inline-block [&_code]:whitespace-nowrap"
    >
      {children}
    </aside>
  );
}

export const mdxComponents = {
  pre: Pre,
  a: Anchor,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  ReleaseSummary,
};
