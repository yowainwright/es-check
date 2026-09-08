import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { after, describe, it } from "node:test";
import Fuse from "fuse.js";
import { createServer } from "vite";
import type { SearchItem } from "../types.ts";

const vite = await createServer({
  server: { middlewareMode: true, ws: false, watch: null },
});
after(() => vite.close());
const { SEARCH_DATA, FUSE_OPTIONS } = (await vite.ssrLoadModule(
  "/src/components/SimpleSearch/constants.ts",
)) as typeof import("../constants.ts");
const fuse = new Fuse(SEARCH_DATA, FUSE_OPTIONS);

function contentPaths(directory: string, prefix: string): string[] {
  const url = new URL(`../../../content/${directory}/`, import.meta.url);
  return readdirSync(url)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => `${prefix}/${file.replace(/\.mdx$/, "")}`);
}

describe("Full-text documentation search", () => {
  it("indexes every documentation page and release with its real route", () => {
    const expected = contentPaths("docs", "/docs").concat(contentPaths("releases", "/release"));
    const actual = SEARCH_DATA.map(({ href }) => href);
    assert.deepEqual(actual.toSorted(), expected.toSorted());
  });

  const bodyQueries = [
    ["loggerOrOptions", "/docs/programmatic-api"],
    ["mappings sources version", "/docs/source-maps"],
    ["Map.getOrInsert", "/release/9-7"],
  ];
  bodyQueries.forEach(([query, href]) => {
    it(`finds body text for ${query}`, () => {
      const results = fuse.search(query, { limit: 8 });
      assert.ok(results.some(({ item }) => item.href === href));
    });
  });

  it("keeps exact title matches ahead of incidental body mentions", () => {
    assert.equal(fuse.search("Programmatic API")[0]?.item.href, "/docs/programmatic-api");
  });

  it("displays quoted documentation descriptions without their delimiters", () => {
    const result = fuse.search("Contributing Guidelines")[0]?.item;
    assert.equal(result?.href, "/docs/contributing-guideline");
    assert.equal(
      result.description,
      "Guidelines for contributing to ES Check - code standards, PR process, and testing requirements",
    );
  });

  it("does not return documents when a query term is absent", () => {
    assert.deepEqual(fuse.search("JavaScript zqxvbnmlkjhgfdsa"), []);
  });

  it("matches terms anywhere in a long document and across fields", () => {
    const content = `${"Unrelated introductory text. ".repeat(200)} webpack devtool configuration`;
    const item: SearchItem = {
      title: "Source Map Support",
      description: "Map errors to the original files",
      href: "/docs/source-maps",
      content,
    };
    const index = new Fuse([item], FUSE_OPTIONS);
    assert.equal(index.search("devtool source")[0]?.item.href, item.href);
    assert.equal(index.search("sorce devtool")[0]?.item.href, item.href);
  });
});
