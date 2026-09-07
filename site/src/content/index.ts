const mdxModules = import.meta.glob<string>("./docs/*.mdx", {
  query: "?raw",
  import: "default",
});

const releaseModules = import.meta.glob<string>("./releases/*.mdx", {
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

export function getAllReleases(): DocEntry[] {
  return Object.entries(releaseModules).map(([path, loader]) => {
    const slug = path.replace("./releases/", "").replace(".mdx", "");
    return {
      slug,
      getContent: loader,
    };
  });
}

export async function getReleaseBySlug(slug: string): Promise<string | null> {
  const releases = getAllReleases();
  const release = releases.find((entry) => entry.slug === slug);

  if (!release) return null;

  return release.getContent();
}
