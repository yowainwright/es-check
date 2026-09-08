import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { transformerNotationDiff, transformerNotationHighlight } from "@shikijs/transformers";
import { extractFrontmatter } from "../../content/frontmatter.ts";

const highlighterPromise = createHighlighterCore({
  themes: [import("shiki/themes/github-light.mjs"), import("shiki/themes/github-dark.mjs")],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/diff.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/jsonc.mjs"),
    import("shiki/langs/yaml.mjs"),
    import("shiki/langs/groovy.mjs"),
  ],
  engine: createJavaScriptRegexEngine(),
});

export interface Heading {
  depth: number;
  slug: string;
  text: string;
  subheadings?: Heading[];
}

export interface CompiledMDX {
  content: React.ComponentType<{ components?: Record<string, React.ElementType> }>;
  frontmatter: Record<string, unknown>;
  headings: Heading[];
}

type HtmlRoot = Parameters<ReturnType<typeof rehypeSlug>>[0];
type HtmlElement = Extract<HtmlRoot["children"][number], { type: "element" }>;
type HtmlNode = HtmlElement["children"][number];

function headingText(node: HtmlNode): string {
  if (node.type === "text") return node.value;
  if (!("children" in node)) return "";
  return node.children.map(headingText).join("");
}

function collectHeadings(node: HtmlNode): Heading[] {
  if (!("children" in node)) return [];
  const isHeading = node.type === "element" && /^h[2-4]$/.test(node.tagName);
  if (!isHeading) return node.children.flatMap(collectHeadings);
  const depth = Number(node.tagName[1]);
  const slug = String(node.properties.id);
  const text = headingText(node);
  return [{ depth, slug, text }];
}

function htmlElement(tagName: string, className: string, children: HtmlNode[]): HtmlElement {
  const classes = className.split(" ");
  const properties = { className: classes };
  return { type: "element", tagName, properties, children };
}

function releaseSection(nodes: HtmlNode[]): HtmlElement {
  const isSummary = (node: HtmlNode) =>
    node.type === "mdxJsxFlowElement" && node.name === "ReleaseSummary";
  const summary = nodes.filter(isSummary);
  const body = nodes.filter((node) => !isSummary(node));
  const notes = htmlElement(
    "div",
    "hidden lg:block min-w-0 lg:self-start lg:sticky lg:top-24",
    summary,
  );
  const content = htmlElement(
    "div",
    "min-w-0 max-w-[720px] [&>:first-child]:mt-0 [&_pre]:max-w-full [&_table]:block [&_table]:overflow-x-auto",
    body,
  );
  return htmlElement(
    "section",
    "grid min-w-0 grid-cols-1 gap-6 border-t border-base-content/10 py-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10",
    [notes, content],
  );
}

function groupReleaseSections(nodes: HtmlNode[]): HtmlNode[] {
  const starts = nodes.flatMap((node, index) => {
    const isMainHeading = node.type === "element" && node.tagName === "h2";
    return isMainHeading ? [index] : [];
  });
  if (starts.length === 0) return nodes;
  const sections = starts.map((start, index) =>
    releaseSection(nodes.slice(start, starts[index + 1])),
  );
  const intro = htmlElement("div", "max-w-[720px] lg:ml-66", nodes.slice(0, starts[0]));
  return [intro].concat(sections);
}

async function compileMarkdown(content: string, collectContent: () => (tree: HtmlRoot) => void) {
  const highlighter = await highlighterPromise;
  const themes = { light: "github-light", dark: "github-dark" };
  const transformers = [transformerNotationDiff(), transformerNotationHighlight()];
  const highlighting = { themes, defaultColor: false as const, transformers };
  return compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      collectContent,
      [rehypeShikiFromHighlighter, highlighter, highlighting],
    ],
  });
}

export async function compileMDX(source: string, layout?: "release"): Promise<CompiledMDX> {
  const { frontmatter, content: mdxContent } = extractFrontmatter(source);
  let headings: Heading[] = [];
  const collectContent = () => (tree: HtmlRoot) => {
    const nodes = tree.children.filter((node): node is HtmlNode => node.type !== "doctype");
    headings = nodes.flatMap(collectHeadings);
    if (layout === "release") tree.children = groupReleaseSections(nodes);
  };
  const compiled = await compileMarkdown(mdxContent, collectContent);
  const runtimeOptions = Object.assign({}, runtime, { baseUrl: import.meta.url });
  const { default: Content } = await run(String(compiled), runtimeOptions);
  return { content: Content as CompiledMDX["content"], frontmatter, headings };
}
