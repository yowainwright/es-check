import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { createProcessor } from "@mdx-js/mdx";
import { parse } from "acorn";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "../../lib/mdx/compileMDX";

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
    const html = renderToStaticMarkup(createElement(compiled.content));
    const headings = compiled.headings.map((heading) => heading.text);

    assert.ok(typeof compiled.frontmatter.title === "string");
    assert.match(compiled.frontmatter.title, /ES Check.*9\.7/);
    assert.ok(headings.includes("Earlier ECMAScript Backfills"));
    assert.match(html, /<pre\b/);
    assert.match(html, /<table\b/);
    assert.ok(hasSpecificationLink(source));
  });

  it("recognizes the specification link target", () => {
    assert.ok(hasSpecificationLink(`[ES2026](${specificationUrl.href})`));
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
