import type { IFuseOptions } from "fuse.js";
import { SIDEBAR, type SidebarSection } from "@/constants/sidebar";
import { extractFrontmatter } from "@/content/frontmatter";
import type { SearchItem } from "./types";

const documents = import.meta.glob<string>("../../content/{docs,releases}/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

function categoryEntries(section: SidebarSection): [string, string][] {
  return section.items.map((item) => [item.href, section.title]);
}

const categories = new Map(SIDEBAR.flatMap(categoryEntries));

function createSearchItem([path, source]: [string, string]): SearchItem {
  const { frontmatter, content } = extractFrontmatter(source);
  const isRelease = path.includes("/releases/");
  const prefix = isRelease ? "/release" : "/docs";
  const slug = path.replace(/^.*\//, "").replace(/\.mdx$/, "");
  const href = `${prefix}/${slug}`;
  const docCategory = categories.get(href) || "Documentation";
  const category = isRelease ? "Releases" : docCategory;
  const title = frontmatter.title || slug;
  const description = frontmatter.description || "";

  return { title, description, href, content, category };
}

export const SEARCH_DATA: SearchItem[] = Object.entries(documents).map(createSearchItem);

export const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.3 },
    { name: "content", weight: 0.2 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  useTokenSearch: true,
  tokenMatch: "all",
  includeScore: true,
  minMatchCharLength: 2,
};
