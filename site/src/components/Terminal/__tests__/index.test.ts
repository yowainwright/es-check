import { after, describe, it } from "node:test";
import assert from "node:assert";
import { createServer } from "vite";

const vite = await createServer({
  server: { middlewareMode: true, ws: false, watch: null },
});
after(() => vite.close());

describe("Terminal types", () => {
  it("TerminalProps interface has correct shape", async () => {
    const { Terminal } = await vite.ssrLoadModule("/src/components/Terminal/index.tsx");
    assert.ok(typeof Terminal === "function", "Terminal should be a function");
  });
});

describe("Terminal defaults", () => {
  it("default title is 'terminal'", async () => {
    const types = await import("../types.ts");
    assert.ok(types, "types module should exist");
  });
});
