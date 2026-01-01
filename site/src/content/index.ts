const mdxModules = import.meta.glob<string>("./docs/*.mdx", {
  query: "?raw",
  import: "default",
});

export interface DocEntry {
  slug: string;
  getContent: () => Promise<string>;
}

export function getAllDocs(): DocEntry[] {
  return Object.entries(mdxModules).map(([path, loader]) => {
    const slug = path.replace("./docs/", "").replace(".mdx", "");
    return {
      slug,
      getContent: loader,
    };
  });
}

export async function getDocBySlug(slug: string): Promise<string | null> {
  const docs = getAllDocs();
  const doc = docs.find((d) => d.slug === slug);

  if (!doc) return null;

  return doc.getContent();
}

export function getDocSlugs(): string[] {
  return getAllDocs().map((doc) => doc.slug);
}
