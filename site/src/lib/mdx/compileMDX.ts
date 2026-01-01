import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import GithubSlugger from "github-slugger";

const highlighterPromise = createHighlighterCore({
  themes: [
    import("shiki/themes/github-light.mjs"),
    import("shiki/themes/github-dark.mjs"),
  ],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/yaml.mjs"),
    import("shiki/langs/groovy.mjs"),
  ],
  engine: createOnigurumaEngine(import("shiki/wasm")),
});

export interface Heading {
  depth: number;
  slug: string;
  text: string;
  subheadings?: Heading[];
}

export interface CompiledMDX {
  content: React.ComponentType;
  frontmatter: Record<string, unknown>;
  headings: Heading[];
}

function extractHeadings(source: string): Heading[] {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(source)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = slugger.slug(text);

    if (depth === 2) {
      headings.push({ depth, slug, text, subheadings: [] });
    } else if (depth === 3 && headings.length > 0) {
      const parent = headings[headings.length - 1];
      parent.subheadings = parent.subheadings || [];
      parent.subheadings.push({ depth, slug, text });
    }
  }

  return headings;
}

function extractFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = source.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: source };
  }

  const frontmatterStr = match[1];
  const content = source.slice(match[0].length);
  const frontmatter: Record<string, unknown> = {};

  frontmatterStr.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, content };
}

export async function compileMDX(source: string): Promise<CompiledMDX> {
  const { frontmatter, content: mdxContent } = extractFrontmatter(source);
  const headings = extractHeadings(mdxContent);

  const highlighter = await highlighterPromise;

  const compiled = await compile(mdxContent, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeShikiFromHighlighter,
        highlighter,
        {
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
          ],
        },
      ],
    ],
  });

  const { default: Content } = await run(String(compiled), {
    ...runtime,
    baseUrl: import.meta.url,
  });

  return {
    content: Content as React.ComponentType,
    frontmatter,
    headings,
  };
}
