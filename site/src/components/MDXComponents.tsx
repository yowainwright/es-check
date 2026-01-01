import { Link } from "@tanstack/react-router";
import { CopyButton } from "./CopyButton";

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <div className="relative group">
      <pre {...props} className="overflow-x-auto p-4 rounded-lg">
        {children}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton />
      </div>
    </div>
  );
}

function Anchor({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");

  if (isInternal && href && !href.startsWith("#")) {
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

function Heading2({
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 id={id} className="group scroll-mt-24" {...props}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </h2>
  );
}

function Heading3({
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 id={id} className="group scroll-mt-24" {...props}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </h3>
  );
}

export const mdxComponents = {
  pre: Pre,
  a: Anchor,
  h2: Heading2,
  h3: Heading3,
};
