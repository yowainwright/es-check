import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { createProcessor } from "@mdx-js/mdx";
import { parse } from "acorn";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "../../lib/mdx/compileMDX";
import { mdxComponents } from "../../components/MDXComponents";
import { getActiveHeadingId } from "../../components/TableOfContents";

const require = createRequire(import.meta.url);
const detectFeatures = require("../../../../lib/detectFeatures");
const releaseUrl = new URL("../releases/9-7.mdx", import.meta.url);
const source = readFileSync(releaseUrl, "utf8");
const tree = createProcessor().parse(source);
const codeBlocks = tree.children.filter((node) => node.type === "code");
const examples = codeBlocks.filter((node) => node.lang === "js" && node.meta === "example");
const expectedExamples = [
  [17, ["ArrayFromAsync"]],
  [17, ["MapGetOrInsert"]],
  [17, ["IteratorConcat"]],
  [17, ["MathSumPrecise"]],
  [17, ["Uint8ArrayFromHex", "Uint8ArrayToHex"]],
  [16, ["IntlDurationFormat"]],
  [15, ["ArrayBufferTransferToFixedLength"]],
  [16, ["MathF16Round", "DataViewGetFloat16", "DataViewSetFloat16"]],
  [6, ["Proxy"]],
] as const;

const specificationUrl = new URL("https://tc39.es/ecma262/2026/multipage/");

function hasSpecificationLink(markdown: string): boolean {
  const parsed = createProcessor().parse(markdown);
  return collectLinkUrls(parsed).some((href) => {
    if (!URL.canParse(href)) return false;
    return new URL(href).href === specificationUrl.href;
  });
}

function collectLinkUrls(node: typeof tree | (typeof tree.children)[number]): string[] {
  if (node.type === "link") return [node.url];
  if (!("children" in node)) return [];
  return node.children.flatMap(collectLinkUrls);
}

describe("ES Check 9.7 release notes", () => {
  it("compiles and renders the article, code blocks, and API table", async () => {
    const compiled = await compileMDX(source);
    const html = renderToStaticMarkup(
      createElement(compiled.content, { components: mdxComponents }),
    );
    const headings = compiled.headings.map((heading) => heading.text);

    assert.ok(typeof compiled.frontmatter.title === "string");
    assert.match(compiled.frontmatter.title, /ES Check.*9\.7/);
    assert.ok(headings.includes("Bug Fixes"));
    assert.ok(headings.includes("Global Built-ins"));
    assert.ok(headings.includes("pnpm and Nub"));
    assert.ok(headings.includes("Benchmarks"));
    assert.match(html, /<pre\b/);
    assert.match(html, /<table\b/);
    assert.ok(hasSpecificationLink(source));
  });

  it("recognizes the specification link target", () => {
    assert.ok(hasSpecificationLink(`[ES2026](${specificationUrl.href})`));
  });

  it("links APIs without examples to their MDN references", () => {
    const paths = [
      "Error/isError",
      "JSON/rawJSON",
      "JSON/isRawJSON",
      "Map/getOrInsertComputed",
      "Uint8Array/fromBase64",
      "Uint8Array/toBase64",
      "Uint8Array/setFromBase64",
      "Uint8Array/setFromHex",
    ];
    const links = collectLinkUrls(tree);
    paths.forEach((path) => {
      const url = `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/${path}`;
      assert.ok(links.includes(url), `Missing MDN reference for ${path}`);
    });
  });

  const incorrectLinks = [
    `[${specificationUrl.href}](https://example.invalid/)`,
    `[ES2026](https://example.invalid/?next=${specificationUrl.href})`,
    `[ES2026](https://example.invalid/${specificationUrl.href})`,
    "[ES2026](https://tc39.es.example.invalid/ecma262/2026/multipage/)",
    "[ES2026](https://tc39.es@example.invalid/ecma262/2026/multipage/)",
    "[ES2026](http://tc39.es/ecma262/2026/multipage/)",
    "[ES2026](https://tc39.es/ecma262/2025/multipage/)",
    "[ES2026](https://tc39.es/ecma262/2026/multipage/?redirect=elsewhere)",
    `\`${specificationUrl.href}\``,
    "[ES2026](not-a-url)",
  ];

  incorrectLinks.forEach((markdown) => {
    it(`rejects an incorrect specification reference: ${markdown}`, () => {
      assert.equal(hasSpecificationLink(markdown), false);
    });
  });

  it("covers every runnable release example", () => {
    assert.equal(examples.length, expectedExamples.length);
  });

  it("opens with a TL;DR and closes with a summary", () => {
    const overviewIndex = source.indexOf("**TL;DR**");
    const firstSectionIndex = source.indexOf("## ES2026 Support");
    assert.ok(overviewIndex > 0 && overviewIndex < firstSectionIndex);
    const headings = tree.children.filter((node) => node.type === "heading");
    const lastHeading = headings.at(-1);
    assert.ok(lastHeading);
    assert.equal(lastHeading.depth, 2);
    const text = lastHeading.children[0];
    assert.equal(text.type, "text");
    assert.equal(text.value, "Summary");
  });

  it("gives every section card a bold title", () => {
    const cards = tree.children
      .filter((node) => node.type === "mdxJsxFlowElement")
      .filter((node) => node.name === "ReleaseSummary");
    assert.equal(cards.length, 5);
    cards.forEach((card) => {
      const title = card.children[0];
      assert.equal(title.type, "paragraph");
      assert.equal(title.children[0].type, "strong");
    });
  });

  it("keeps the documented global fallback valid at ES5", () => {
    const example = codeBlocks.find((node) => node.meta === "guarded");
    assert.ok(example);
    const ast = parse(example.value, { ecmaVersion: 5 });
    const result = detectFeatures(example.value, 5, "script", new Set(), { ast });
    assert.deepEqual(result.unsupportedFeatures, []);
    assert.equal(result.foundFeatures.Reflect, false);
  });

  it("keeps each documented global version synchronized with the detector", () => {
    const { ES_GLOBAL_MIN_VERSION } = require("../../../../lib/constants/es-features/globals");
    const block = codeBlocks.find(
      (node) => node.lang === "jsonc" && node.value.includes('"Proxy"'),
    );
    assert.ok(block);
    const ast = parse(`(${block.value})`, { ecmaVersion: "latest" });
    const statement = ast.body[0];
    assert.equal(statement.type, "ExpressionStatement");
    assert.equal(statement.expression.type, "ObjectExpression");
    statement.expression.properties.forEach((property) => {
      assert.equal(property.type, "Property");
      assert.equal(property.key.type, "Literal");
      assert.equal(property.value.type, "Literal");
      const name = String(property.key.value);
      assert.equal(property.value.value, ES_GLOBAL_MIN_VERSION[name]);
    });
  });

  it("highlights diff and JSONC blocks", async () => {
    const markdown = [
      "```diff",
      "- const results = [];",
      "+ const results = await Array.fromAsync(resultStream);",
      "```",
      "```jsonc",
      '{ "minVersion": 17 /* ES2026 */ }',
      "```",
    ].join("\n");
    const compiled = await compileMDX(markdown);
    const html = renderToStaticMarkup(createElement(compiled.content));
    const highlightedBlocks = html.match(/<pre class="shiki\b/g) ?? [];

    assert.equal(highlightedBlocks.length, 2);
  });

  expectedExamples.forEach(([target, features], index) => {
    it(`accepts ${features.join(", ")} at edition ${target}`, () => {
      const example = examples[index];
      assert.ok(example, `Missing release example ${index + 1}`);
      const ast = parse(example.value, { ecmaVersion: "latest" });
      const result = detectFeatures(example.value, target, "script", new Set(), { ast });

      assert.deepEqual(result.unsupportedFeatures, []);
      features.forEach((feature) => assert.equal(result.foundFeatures[feature], true));
    });

    it(`rejects ${features.join(", ")} at edition ${target - 1}`, () => {
      const example = examples[index];
      assert.ok(example, `Missing release example ${index + 1}`);
      const ast = parse(example.value, { ecmaVersion: "latest" });

      assert.throws(() => detectFeatures(example.value, target - 1, "script", new Set(), { ast }), {
        features,
      });
    });
  });
});

describe("Documentation headings and release sections", () => {
  it("uses rendered IDs for inline code, duplicate headings, and level-four headings", async () => {
    const markdown =
      "## Use `Array.fromAsync`\n\n### Details\n\n#### Limits\n\n## Use `Array.fromAsync`\n\n```text\n## Not a heading\n```";
    const compiled = await compileMDX(markdown);
    assert.deepEqual(
      compiled.headings.map(({ slug }) => slug),
      ["use-arrayfromasync", "details", "limits", "use-arrayfromasync-1"],
    );
    const html = renderToStaticMarkup(
      createElement(compiled.content, { components: mdxComponents }),
    );
    compiled.headings.forEach(({ slug }) => assert.ok(html.includes(`id="${slug}"`)));
  });

  it("groups each main release section with its own summary and preserves its examples", async () => {
    const compiled = await compileMDX(source, "release");
    const html = renderToStaticMarkup(
      createElement(compiled.content, { components: mdxComponents }),
    );
    const mainHeadings = compiled.headings.filter((heading) => heading.depth === 2);
    assert.equal(html.match(/<section\b/g)?.length, mainHeadings.length);
    assert.equal(html.match(/aria-label="Section summary"/g)?.length, 5);
    assert.ok(html.includes("collectSearchResults"));
    assert.ok(html.includes("formatDeliveryWindow"));
    assert.ok(html.includes("hidden lg:block"));
    assert.ok(html.includes("<strong>ES2026 Support</strong>"));
    assert.ok(html.includes("<strong>Earlier ECMAScript Backfills</strong>"));
    assert.ok(html.indexOf("</aside>") < html.indexOf('<h2 id="es2026-support"'));
    assert.deepEqual(
      mainHeadings.map((heading) => heading.text),
      ["ES2026 Support", "Bug Fixes", "Global Built-ins", "pnpm and Nub", "Benchmarks", "Summary"],
    );
  });

  it("keeps the preceding heading active between sections and when scrolling upward", () => {
    assert.equal(
      getActiveHeadingId([
        { id: "first", top: -200 },
        { id: "second", top: 120 },
      ]),
      "first",
    );
    assert.equal(
      getActiveHeadingId([
        { id: "first", top: -300 },
        { id: "second", top: 90 },
      ]),
      "second",
    );
    assert.equal(
      getActiveHeadingId([
        { id: "first", top: -200 },
        { id: "second", top: 120 },
      ]),
      "first",
    );
  });

  it("handles the top, bottom, and a page without headings", () => {
    const positions = [
      { id: "first", top: 120 },
      { id: "last", top: 300 },
    ];
    assert.equal(getActiveHeadingId(positions), "first");
    assert.equal(getActiveHeadingId(positions, true), "last");
    assert.equal(getActiveHeadingId([]), "");
  });
});
