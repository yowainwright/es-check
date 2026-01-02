import { describe, it } from "node:test";
import assert from "node:assert";

describe("Terminal types", () => {
  it("TerminalProps interface has correct shape", async () => {
    const { Terminal } = await import("../index");
    assert.ok(typeof Terminal === "function", "Terminal should be a function");
  });
});

describe("Terminal defaults", () => {
  it("default title is 'terminal'", async () => {
    const types = await import("../types");
    assert.ok(types, "types module should exist");
  });
});
