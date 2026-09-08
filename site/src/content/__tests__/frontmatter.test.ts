import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractFrontmatter } from "../frontmatter.ts";

describe("Frontmatter display values", () => {
  const cases = [
    ['"Contributing guidelines"', "Contributing guidelines"],
    ["'Contributing guidelines'", "Contributing guidelines"],
    ['"ES Check: contributor guide"', "ES Check: contributor guide"],
    ["'Use the \"check\" command'", 'Use the "check" command'],
    ['""', ""],
    ["Unquoted description", "Unquoted description"],
    ['"Unmatched quote', '"Unmatched quote'],
  ];

  cases.forEach(([value, expected]) => {
    it(`normalizes ${value} without changing the body`, () => {
      const source = `---\ntitle: ${value}\ndescription: ${value}\n---\n# Body\n`;
      const { frontmatter, content } = extractFrontmatter(source);
      assert.equal(frontmatter.title, expected);
      assert.equal(frontmatter.description, expected);
      assert.equal(content, "# Body\n");
    });
  });
});
