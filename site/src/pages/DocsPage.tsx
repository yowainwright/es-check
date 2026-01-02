import { useParams, Link, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { getDocBySlug } from "@/content";
import { compileMDX, type CompiledMDX } from "@/lib/mdx/compileMDX";
import { TableOfContents, mdxComponents, Pagination } from "@/components";

export function DocsPage() {
  const { slug } = useParams({ from: "/docs/$slug" });
  const [compiled, setCompiled] = useState<CompiledMDX | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return <Navigate to="/docs/$slug" params={{ slug: "gettingstarted" }} />;
  }

  const title = (compiled?.frontmatter?.title as string) || slug;
  const description = (compiled?.frontmatter?.description as string) || "";
  const Content = compiled?.content;
  const headings = compiled?.headings || [];
  const currentPath = `/docs/${slug}`;

  return (
    <section className="flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 md:pt-10 font-sans gap-8">
      <article className="flex flex-col w-full max-w-[620px]">
        <Breadcrumbs title={title} />

        <section className="prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto">
          <header>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>

          <div className="divider my-5" />

          <ContentRenderer loading={loading} Content={Content} />
        </section>

        <div className="divider" />
        <Pagination currentPath={currentPath} />
      </article>

      <aside className="hidden xl:block pl-8">
        <TableOfContents headings={headings} />
      </aside>
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
        <li className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {title}
        </li>
      </ul>
    </div>
  );
}

type MDXContent = React.ComponentType<{
  components?: Record<string, React.ComponentType>;
}>;

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
