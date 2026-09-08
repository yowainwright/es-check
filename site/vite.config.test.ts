import assert from "node:assert/strict";
import { it } from "node:test";
import { fileURLToPath } from "node:url";
import { build, resolveConfig, type Rolldown } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const vendorNames = ["react-vendor", "router", "fuse", "mdx", "shiki"];

function assertRolldown(this: Rolldown.PluginContext) {
  assert.match(this.meta.rolldownVersion, /^\d+\.\d+\.\d+/);
}

it("uses Oxc without narrowing browser support", async () => {
  const config = await resolveConfig({ root }, "build");
  const pluginNames = config.plugins.map((plugin) => plugin.name);

  assert.ok(pluginNames.includes("vite:oxc"));
  assert.equal(config.build.minify, "oxc");
  assert.equal(config.build.cssMinify, true);
  assert.deepEqual(config.build.target, ["chrome107", "edge107", "firefox104", "safari16"]);
});

it("builds the site with Rolldown, vendor chunks, and deployment asset paths", async (t) => {
  const buildStart = t.mock.fn(assertRolldown);
  const plugins = [{ name: "verify-rolldown", buildStart }];
  const result = await build({ root, plugins, build: { write: false }, logLevel: "silent" });

  assert.equal(buildStart.mock.callCount(), 1);
  assert.ok("output" in result);
  const chunks = result.output.filter((output) => output.type === "chunk");
  const chunkNames = chunks.map((chunk) => chunk.name);
  vendorNames.forEach((name) => assert.ok(chunkNames.includes(name), `Missing ${name} chunk`));
  const html = result.output.find((output) => output.fileName === "index.html");
  assert.equal(html?.type, "asset");
  assert.match(String(html.source), /\/es-check\/assets\//);
});
