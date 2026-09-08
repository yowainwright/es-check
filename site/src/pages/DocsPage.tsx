import { useParams, Link, Navigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { getDocBySlug } from "@/content";
import { compileMDX, type CompiledMDX } from "@/lib/mdx/compileMDX";
import { TableOfContents, mdxComponents, Pagination } from "@/components";
import { useLayout } from "@/contexts";

export function DocsPage() {
  const { slug } = useParams({ from: "/docs/$slug" });
  const [compiled, setCompiled] = useState<CompiledMDX | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setRightSidebarContent } = useLayout();
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setLoading(true);
      setError(null);

      const rawContent = await getDocBySlug(slug);
      if (cancelled) return;

      if (!rawContent) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      const result = await compileMDX(rawContent);
      if (cancelled) return;

      setCompiled(result);
      setLoading(false);
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const ready = compiled !== null && !loading;
    const contents = ready ? (
      <TableOfContents headings={compiled.headings} articleRef={articleRef} />
    ) : null;
    setRightSidebarContent(contents);
    return () => setRightSidebarContent(null);
  }, [compiled, loading, setRightSidebarContent]);

  if (error) {
    return <Navigate to="/docs/$slug" params={{ slug: "gettingstarted" }} />;
  }

  const title = (compiled?.frontmatter?.title as string) || slug;
  const description = (compiled?.frontmatter?.description as string) || "";
  const Content = compiled?.content;
  const currentPath = `/docs/${slug}`;

  return (
    <section className="py-4 sm:py-6 md:py-10 font-sans">
      <article className="flex w-full min-w-0 flex-col">
        <Breadcrumbs title={title} />

        <section className="prose prose-sm sm:prose-base md:prose-md mb-10 min-w-0 max-w-none prose-pre:max-w-full prose-pre:overflow-x-auto">
          <header>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>

          <div className="divider my-5" />

          <div ref={articleRef} id="docs-content">
            <ContentRenderer loading={loading} Content={Content} />
          </div>
        </section>

        <div className="divider" />
        <Pagination currentPath={currentPath} />
      </article>
    </section>
  );
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <div className="breadcrumbs text-sm mb-4">
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/docs/$slug" params={{ slug: "gettingstarted" }}>
            Docs
          </Link>
        </li>
        <li>{title}</li>
      </ul>
    </div>
  );
}

type MDXContent = CompiledMDX["content"];

interface ContentRendererProps {
  loading: boolean;
  Content: MDXContent | null | undefined;
}

function ContentRenderer({ loading, Content }: ContentRendererProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!Content) {
    return <p>Content not available.</p>;
  }

  return <Content components={mdxComponents} />;
}
