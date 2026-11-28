import { readFileSync, readdirSync } from "node:fs";
import type { Plugin } from "vite";
import { extractFrontmatter } from "./src/content/frontmatter.ts";

interface Page {
  path: string;
  title: string;
  description: string;
}

const siteUrl = "https://jeffry.in/es-check/";
const siteTitle = "ES Check - JavaScript ES Version Checker";
const siteDescription = "Check JavaScript files for ECMAScript version and browser compatibility.";
const imageUrl = new URL("social-preview.png", siteUrl).href;
const imageAlt =
  "ES Check logo above the headline “Check JavaScript files for ES version compatibility”.";

export function socialPages(): Plugin {
  return {
    name: "es-check-social-pages",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      const hero = bundle["hero/index.html"];
      const missingEntry = index?.type !== "asset" || hero?.type !== "asset";
      if (missingEntry) this.error("Missing site HTML entry");
      const shell = String(index.source);
      index.source = renderPage(shell, sitePage(""));
      hero.source = renderPage(String(hero.source), sitePage("hero/"));
      shareablePages().forEach((page) => {
        const fileName = `${page.path}index.html`;
        const source = renderPage(shell, page);
        this.emitFile({ type: "asset", fileName, source });
      });
    },
  };
}

function shareablePages() {
  const pages = [
    sitePage("docs/"),
    sitePage("community/", "ES Check Community"),
    sitePage("release/", "ES Check Releases"),
  ];
  return pages.concat(contentPages("docs", "docs"), contentPages("releases", "release"));
}

function sitePage(path: string, title = siteTitle): Page {
  return { path, title, description: siteDescription };
}

function contentPages(folder: "docs" | "releases", route: string): Page[] {
  const directory = new URL(`./src/content/${folder}/`, import.meta.url);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => {
      const source = readFileSync(new URL(name, directory), "utf8");
      const { frontmatter } = extractFrontmatter(source);
      const path = `${route}/${name.slice(0, -4)}/`;
      return { path, title: frontmatter.title, description: frontmatter.description };
    });
}

function renderPage(shell: string, page: Page) {
  const title = escapeAttribute(page.title);
  const description = escapeAttribute(page.description);
  const url = new URL(page.path, siteUrl).href;
  const metadata = `<meta property="og:type" content="website" />
    <meta property="og:site_name" content="ES Check" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="640" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />`;
  return shell.replace("</head>", () => metadata + "\n  </head>");
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
