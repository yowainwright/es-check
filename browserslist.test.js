const { getESVersionFromBrowserslist } = require('./browserslist');
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
});

after(() => {
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-modern'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-legacy'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-mixed'));
  fs.unlinkSync(path.join(__dirname, '.browserslistrc-env'));
});

describe('Browserslist Integration', () => {
  it('should determine ES6+ for modern browsers', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistPath: path.join(__dirname, '.browserslistrc-modern')
    });
    assert(esVersion >= 6, 'ES version should be 6 or higher for modern browsers');
  });

  it('should determine ES5 for legacy browsers', () => {
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

  it('should determine ES5 for old browserslist query (Safary >= 5) ', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'Safari >= 5'
    });
    assert.strictEqual(esVersion, 5, 'ES version should 5 for `Safary >= 5` browserslist query');
  });

  it('should determine ES6 for corresponding browserslist query', () => {
    const esVersion = getESVersionFromBrowserslist({
      browserslistQuery: 'Chrome >= 100'
    });
    assert.strictEqual(esVersion, 6, 'ES version should 6 for `Chrome >= 100` browserslist query');
  });
});
