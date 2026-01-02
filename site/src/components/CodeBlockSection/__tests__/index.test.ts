import { describe, it } from "node:test";
import assert from "node:assert";
import { ES_CHECK_DEMO } from "../../AnimatedTerminal/constants";
import {
  createTerminalLine,
  createCommandLine,
  createInfoLine,
  createErrorLine,
  createEmptyLine,
} from "../utils";

describe("AnimatedTerminal demo constants", () => {
  it("has valid ES_CHECK_DEMO configuration", () => {
    assert.ok(Array.isArray(ES_CHECK_DEMO));
    assert.ok(ES_CHECK_DEMO.length > 0);
    assert.ok(ES_CHECK_DEMO[0].lines.length > 0);
    assert.ok(typeof ES_CHECK_DEMO[0].pauseAfter === "number");
  });

  it("ES_CHECK_DEMO contains command and output lines", () => {
    const demo = ES_CHECK_DEMO[0];
    const commandLines = demo.lines.filter((l) => l.prefix === "$");
    const outputLines = demo.lines.filter((l) => l.prefix === "");

    assert.ok(commandLines.length > 0, "Should have command lines");
    assert.ok(outputLines.length > 0, "Should have output lines");
  });
});

describe("CodeBlockSection utils", () => {
  it("createTerminalLine creates line with defaults", () => {
    const line = createTerminalLine("test text");
    assert.strictEqual(line.text, "test text");
    assert.strictEqual(line.prefix, "");
    assert.strictEqual(line.animate, false);
  });

  it("createTerminalLine accepts options", () => {
    const line = createTerminalLine("test", {
      prefix: "$",
      animate: true,
      className: "text-red",
    });
    assert.strictEqual(line.prefix, "$");
    assert.strictEqual(line.animate, true);
    assert.strictEqual(line.className, "text-red");
  });

  it("createCommandLine creates animated command", () => {
    const line = createCommandLine("npm install");
    assert.strictEqual(line.prefix, "$");
    assert.strictEqual(line.text, "npm install");
    assert.strictEqual(line.animate, true);
  });

  it("createInfoLine creates info-styled line", () => {
    const line = createInfoLine("checking files");
    assert.ok(line.text.startsWith("info:"));
    assert.strictEqual(line.className, "text-cyan-400");
  });

  it("createErrorLine creates error-styled line", () => {
    const line = createErrorLine("file not found");
    assert.strictEqual(line.text, "file not found");
    assert.strictEqual(line.className, "text-red-400");
  });

  it("createEmptyLine creates spacer line", () => {
    const line = createEmptyLine();
    assert.strictEqual(line.text, "");
    assert.strictEqual(line.delay, 150);

    const customLine = createEmptyLine(300);
    assert.strictEqual(customLine.delay, 300);
  });
});
