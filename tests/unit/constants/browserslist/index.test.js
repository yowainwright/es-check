const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  BROWSER_TO_ES_VERSION,
  BROWSERSLIST_TO_BCD,
} = require("../../../../lib/constants/browserslist");

test("BROWSER_TO_ES_VERSION maps browser releases to ES editions", () => {
  assert.equal(typeof BROWSER_TO_ES_VERSION, "object");
  assert(Object.keys(BROWSER_TO_ES_VERSION).length > 0);
});

test("mobile Chromium and Firefox share their desktop version mappings", () => {
  assert.equal(BROWSER_TO_ES_VERSION.and_chr, BROWSER_TO_ES_VERSION.chrome);
  assert.equal(BROWSER_TO_ES_VERSION.and_ff, BROWSER_TO_ES_VERSION.firefox);
});

test("BROWSERSLIST_TO_BCD maps mobile browser identifiers", () => {
  assert.equal(BROWSERSLIST_TO_BCD.and_chr, "chrome_android");
  assert.equal(BROWSERSLIST_TO_BCD.and_ff, "firefox_android");
  assert.equal(BROWSERSLIST_TO_BCD.ios_saf, "safari_ios");
  assert.equal(BROWSERSLIST_TO_BCD.samsung, "samsunginternet_android");
});
