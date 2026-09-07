import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getReleaseBySlug } from "@/content";
import { compileMDX, type CompiledMDX } from "@/lib/mdx/compileMDX";
import { mdxComponents } from "@/components";

export function ReleasePage() {
  const { version } = useParams({ from: "/release/$version" });
  const [compiled, setCompiled] = useState<CompiledMDX | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setLoading(true);

      const rawContent = await getReleaseBySlug(version);
      if (cancelled) return;

      const result = rawContent ? await compileMDX(rawContent) : null;
      if (cancelled) return;

      setCompiled(result);
      setLoading(false);
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const title = (compiled?.frontmatter?.title as string) || `Release ${version}`;
  const description = (compiled?.frontmatter?.description as string) || "";
  const Content = compiled?.content;

  return (
    <section className="p-4 sm:p-6 md:p-10 md:pt-10 font-sans">
      <article className="mx-auto flex w-full max-w-[720px] flex-col">
        <Breadcrumbs title={title} />

        <section className="prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto">
          <header>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </header>

          <div className="divider my-5" />

          <ContentRenderer loading={loading} Content={Content} />
        </section>
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
        <li>Releases</li>
        <li>{title}</li>
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
    return <p>Release notes are not available.</p>;
  }

  return <Content components={mdxComponents} />;
}
