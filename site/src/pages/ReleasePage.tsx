import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAllReleases, getReleaseBySlug } from "@/content";
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

      const result = rawContent
        ? await compileMDX(rawContent, "release", `Release ${version}`)
        : null;
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
  const Content = compiled?.content;
  const needsTitle = loading || !Content;
  const fallbackTitle = needsTitle && (
    <header className="max-w-[720px] lg:ml-66">
      <h1>{title}</h1>
    </header>
  );

  return (
    <section className="p-4 sm:p-6 md:p-10 md:pt-10 font-sans">
      <article className="mx-auto flex w-full max-w-6xl flex-col">
        <Breadcrumbs title={title} />

        <section className="prose prose-sm sm:prose-base mb-10 min-w-0 max-w-none prose-pre:max-w-full prose-pre:overflow-x-auto">
          {fallbackTitle}
          <ContentRenderer loading={loading} Content={Content} />
        </section>
      </article>
    </section>
  );
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="breadcrumbs text-sm mb-4 max-w-[720px] lg:ml-66 [&_ul]:flex-wrap [&_ul]:gap-y-1 [&_li]:whitespace-normal"
    >
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/release">Releases</Link>
        </li>
        <li aria-current="page">{title}</li>
      </ul>
    </nav>
  );
}

export function ReleasesPage() {
  const releases = getAllReleases();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 font-sans">
      <nav aria-label="Breadcrumb" className="breadcrumbs mb-6 text-sm">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">Releases</li>
        </ul>
      </nav>
      <h1 className="mb-8 text-3xl font-bold">Releases</h1>
      <ul className="divide-y divide-base-content/10 border-y border-base-content/10">
        {releases.map((release) => (
          <li key={release.slug} className="py-6">
            <Link
              to="/release/$version"
              params={{ version: release.slug }}
              className="text-xl font-semibold text-primary hover:underline"
            >
              ES Check {release.slug.replace("-", ".")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
    return <p>Release notes are not available.</p>;
  }

  return <Content components={mdxComponents} />;
}
