const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const {
  getESVersionFromBrowserslist,
  getESVersionForBrowser,
} = require("../../lib/browserslist");
const fs = require("fs");
const path = require("path");

before(() => {
  fs.writeFileSync(
    path.join(__dirname, ".browserslistrc-modern"),
    "last 2 Chrome versions\nlast 2 Firefox versions",
  );

  fs.writeFileSync(path.join(__dirname, ".browserslistrc-legacy"), "IE 11");

  fs.writeFileSync(
    path.join(__dirname, ".browserslistrc-mixed"),
    "last 2 Chrome versions\nIE 11",
  );

  fs.writeFileSync(
    path.join(__dirname, ".browserslistrc-env"),
    "[modern]\nlast 2 Chrome versions\nlast 2 Firefox versions\n\n[legacy]\nIE 11",
  );

  fs.writeFileSync(path.join(__dirname, ".browserslistrc-old-edge"), "Edge 18");
});

after(() => {
  fs.unlinkSync(path.join(__dirname, ".browserslistrc-modern"));
  fs.unlinkSync(path.join(__dirname, ".browserslistrc-legacy"));
  fs.unlinkSync(path.join(__dirname, ".browserslistrc-mixed"));
  fs.unlinkSync(path.join(__dirname, ".browserslistrc-env"));
  fs.unlinkSync(path.join(__dirname, ".browserslistrc-old-edge"));
});

describe("getESVersionFromBrowserslist", () => {
  it("should determine ES6+ for modern browsers", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, ".browserslistrc-modern"),
    });
    assert(
      esVersion >= 6,
      "ES version should be 6 or higher for modern browsers",
    );
  });

  it("should determine ES5 for legacy browsers (IE)", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, ".browserslistrc-legacy"),
    });
    assert.strictEqual(esVersion, 5, "ES version should be 5 for IE 11");
  });

  it("should determine ES5 for mixed browser support (lowest common denominator)", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, ".browserslistrc-mixed"),
    });
    assert.strictEqual(
      esVersion,
      5,
      "ES version should be 5 when IE 11 is included",
    );
  });

  it("should respect the browserslist environment", () => {
    const modernEsVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, ".browserslistrc-env"),
      browserslistEnv: "modern",
    });
    assert(
      modernEsVersion >= 6,
      "ES version should be 6 or higher for modern environment",
    );

    const legacyEsVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, ".browserslistrc-env"),
      browserslistEnv: "legacy",
    });
    assert.strictEqual(
      legacyEsVersion,
      5,
      "ES version should be 5 for legacy environment",
    );
  });

  it("should default to ES5 if no browserslist config is found", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, "non-existent-file"),
    });
    assert.strictEqual(
      esVersion,
      5,
      "ES version should default to 5 if no config is found",
    );
  });

  it("should determine ES12+ for Safari 14+", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "Safari >= 14",
    });
    assert(esVersion >= 12, "ES version should be 12 or higher for Safari 14+");
  });

  it("should determine correct ES version for modern Chrome versions", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "Chrome >= 100",
    });
    assert(
      esVersion >= 11,
      "ES version should be 11 or higher for Chrome >= 100",
    );
  });

  it("should determine ES14 for Chrome 111", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "chrome 111",
    });
    assert.strictEqual(esVersion, 14, "ES version should be 14 for Chrome 111");
  });

  it("should return ES5 if browserslist throws an error", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "invalid query",
    });
    assert.strictEqual(esVersion, 5, "ES version should default to 5 on error");
  });

  it("should return ES5 for a query that matches no browsers", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "> 99.99%",
    });
    assert.strictEqual(
      esVersion,
      5,
      "ES version should be 5 for no matching browsers",
    );
  });

  it("should return minimum ES version when browsers have different support levels (issue #382)", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "firefox 100, chrome 51",
    });
    assert.strictEqual(
      esVersion,
      6,
      "Should return ES6 (minimum) when mixing modern Firefox with older Chrome",
    );
  });

  it("should filter out unknown browsers and use minimum of known browsers", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "chrome 100, chrome 60",
    });
    assert.strictEqual(
      esVersion,
      9,
      "Should return ES9 as the minimum between Chrome 100 (ES14) and Chrome 60 (ES9)",
    );
  });

  it("should return ES5 when only unknown browsers are specified", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "kaios 2.5",
    });
    assert.strictEqual(
      esVersion,
      5,
      "Should return ES5 when no known browsers are in the query",
    );
  });

  it("should return correct version for single browser query", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "chrome 97",
    });
    assert.strictEqual(
      esVersion,
      14,
      "Single browser Chrome 97 should return ES14",
    );
  });

  it("should return same version when all browsers have same ES level", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "chrome 97, firefox 104, edge 97",
    });
    assert.strictEqual(
      esVersion,
      14,
      "All ES14 browsers should return ES14",
    );
  });

  it("should handle three browsers with different ES versions and return minimum", () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: "chrome 117, firefox 52, safari 14",
    });
    assert.strictEqual(
      esVersion,
      6,
      "Firefox 52 (ES6) should be the minimum among Chrome 117 (ES15), Firefox 52 (ES6), Safari 14 (ES12)",
    );
  });
});

describe("getESVersionForBrowser", () => {
  it("should return default ES5 for an unknown browser", () => {
    assert.strictEqual(getESVersionForBrowser("nonexistentbrowser", "1.0"), 5);
  });

  it("should return default ES5 for a known browser with a version lower than any defined", () => {
    assert.strictEqual(getESVersionForBrowser("safari", "9"), 5);
  });

  it("should return ES6 for Chrome with a version lower than any defined", () => {
    assert.strictEqual(getESVersionForBrowser("chrome", "40"), 6);
  });

  it("should return ES6 for Firefox with a version lower than any defined", () => {
    assert.strictEqual(getESVersionForBrowser("firefox", "40"), 6);
  });

  it("should return ES14 for Chrome 111", () => {
    assert.strictEqual(getESVersionForBrowser("chrome", "111"), 14);
  });

  it("should return ES15 for Chrome 120", () => {
    const esVersion = getESVersionForBrowser("chrome", "120");
    assert.strictEqual(esVersion, 15, "Chrome 120 should map to ES15");
  });

  it("should return ES9 for Chrome 60 to support object spread (issue #383)", () => {
    const esVersion = getESVersionForBrowser("chrome", "60");
    assert.strictEqual(
      esVersion,
      9,
      "Chrome 60 should map to ES9 to support object spread syntax",
    );
  });

  it("should return ES8 for Chrome 58", () => {
    const esVersion = getESVersionForBrowser("chrome", "58");
    assert.strictEqual(esVersion, 8, "Chrome 58 should map to ES8");
  });
});
