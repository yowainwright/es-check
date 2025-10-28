const { getESVersionFromBrowserslist, getESVersionForBrowser } = require('../../lib/browserslist');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, before, after } = require('mocha');

before(() => {
  fs.writeFileSync(
    path.join(__dirname, '.browserslistrc-modern'),
    'last 2 Chrome versions\nlast 2 Firefox versions'
  );

  fs.writeFileSync(
    path.join(__dirname, '.browserslistrc-legacy'),
    'IE 11'
  );

  fs.writeFileSync(
    path.join(__dirname, '.browserslistrc-mixed'),
    'last 2 Chrome versions\nIE 11'
  );

  fs.writeFileSync(
    path.join(__dirname, '.browserslistrc-env'),
    '[modern]\nlast 2 Chrome versions\nlast 2 Firefox versions\n\n[legacy]\nIE 11'
  );

  fs.writeFileSync(
    path.join(__dirname, '.browserslistrc-old-edge'),
    'Edge 18'
  );
});

after(() => {
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-modern'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-legacy'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-mixed'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-env'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-old-edge'));
});

describe('getESVersionFromBrowserslist', () => {
  it('should determine ES6+ for modern browsers', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-modern')
    });
    assert(esVersion >= 6, 'ES version should be 6 or higher for modern browsers');
  });

  it('should determine ES5 for legacy browsers (IE)', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-legacy')
    });
    assert.strictEqual(esVersion, 5, 'ES version should be 5 for IE 11');
  });

  it('should determine ES5 for mixed browser support (lowest common denominator)', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-mixed')
    });
    assert.strictEqual(esVersion, 5, 'ES version should be 5 when IE 11 is included');
  });

  it('should respect the browserslist environment', () => {
    const modernEsVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-env'),
      browserslistEnv: 'modern'
    });
    assert(modernEsVersion >= 6, 'ES version should be 6 or higher for modern environment');

    const legacyEsVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-env'),
      browserslistEnv: 'legacy'
    });
    assert.strictEqual(legacyEsVersion, 5, 'ES version should be 5 for legacy environment');
  });

  it('should default to ES5 if no browserslist config is found', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, 'non-existent-file')
    });
    assert.strictEqual(esVersion, 5, 'ES version should default to 5 if no config is found');
  });

  it('should determine ES5 for browsers not explicitly defined as modern', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'Safari >= 14'
    });
    assert.strictEqual(esVersion, 5, 'ES version should be 5 for browsers like Safari');
  });

  it('should determine correct ES version for modern Chrome versions', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'Chrome >= 100'
    });
    assert(esVersion >= 11, 'ES version should be 11 or higher for Chrome >= 100');
  });

  it('should determine correct ES version for specific Chrome version (issue #324)', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'chrome 111'
    });
    assert.strictEqual(esVersion, 11, 'ES version should be 11 for Chrome 111');
  });

  it('should return ES5 if browserslist throws an error', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'invalid query'
    });
    assert.strictEqual(esVersion, 5, 'ES version should default to 5 on error');
  });

  it('should return ES5 for a query that matches no browsers', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: '> 99.99%'
    });
    assert.strictEqual(esVersion, 5, 'ES version should be 5 for no matching browsers');
  });
});

describe('getESVersionForBrowser', () => {
  it('should return default ES5 for an unknown browser', () => {
    assert.strictEqual(getESVersionForBrowser('nonexistentbrowser', '1.0'), 5);
  });

  it('should return default ES5 for a known browser with a version lower than any defined', () => {
    assert.strictEqual(getESVersionForBrowser('safari', '9'), 5);
  });

  it('should return ES6 for Chrome with a version lower than any defined', () => {
    assert.strictEqual(getESVersionForBrowser('chrome', '40'), 6);
  });

  it('should return ES6 for Firefox with a version lower than any defined', () => {
    assert.strictEqual(getESVersionForBrowser('firefox', '40'), 6);
  });

  it('should return ES11 for Chrome 111', () => {
    assert.strictEqual(getESVersionForBrowser('chrome', '111'), 11);
  });

  it('should return higher ES version for Chrome versions beyond defined mappings', () => {
    const esVersion = getESVersionForBrowser('chrome', '120');
    assert.strictEqual(esVersion, 11, 'Chrome 120 should map to ES11 (highest defined)');
  });
});
