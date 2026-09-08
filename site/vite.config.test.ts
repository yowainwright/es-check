import assert from "node:assert/strict";
import { it } from "node:test";
import { fileURLToPath } from "node:url";
import { build, resolveConfig, type Rolldown } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const vendorNames = ["react-vendor", "router", "fuse", "mdx", "shiki"];

function assertRolldown(this: Rolldown.PluginContext) {
  assert.match(this.meta.rolldownVersion, /^\d+\.\d+\.\d+/);
}

function collectStaticImports(
  chunk: Rolldown.OutputChunk,
  chunks: Map<string, Rolldown.OutputChunk>,
  seen = new Set<string>(),
): Rolldown.OutputChunk[] {
  if (seen.has(chunk.fileName)) return [];
  seen.add(chunk.fileName);
  const imports = chunk.imports.flatMap((fileName) => {
    const dependency = chunks.get(fileName);
    if (!dependency) return [];
    return collectStaticImports(dependency, chunks, seen);
  });
  return [chunk].concat(imports);
}

function hasModule(chunk: Rolldown.OutputChunk, suffix: string): boolean {
  return Object.keys(chunk.modules).some((id) => id.endsWith(suffix));
}

function assertSearchLoadsOnDemand(chunks: Rolldown.OutputChunk[]) {
  const chunksByName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const header = chunks.find((chunk) => hasModule(chunk, "/components/Header.tsx"));
  assert.ok(header);
  const initialChunks = collectStaticImports(header, chunksByName);
  const modules = initialChunks.flatMap((chunk) => Object.keys(chunk.modules));
  const hasDocuments = modules.some((id) => /\/content\/(docs|releases)\//.test(id));
  const hasFuse = modules.some((id) => id.includes("/node_modules/fuse.js/"));
  assert.equal(hasDocuments, false, "Header must not load the document corpus");
  assert.equal(hasFuse, false, "Header must not load Fuse before search opens");
  const search = chunks.find((chunk) => hasModule(chunk, "/SimpleSearch/SearchContent.tsx"));
  assert.ok(search?.isDynamicEntry, "Search content must have a dynamic import boundary");
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
  assertSearchLoadsOnDemand(chunks);
  const chunkNames = chunks.map((chunk) => chunk.name);
  vendorNames.forEach((name) => assert.ok(chunkNames.includes(name), `Missing ${name} chunk`));
  const html = result.output.find((output) => output.fileName === "index.html");
  assert.equal(html?.type, "asset");
  assert.match(String(html.source), /\/es-check\/assets\//);
});
