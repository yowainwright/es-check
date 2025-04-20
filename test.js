'use strict';

const exec = require('child_process').exec;
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Remove global beforeEach and afterEach

it('🎉  Es Check should pass when checking an array of es5 files as es5', (done) => {
  exec('node index.js es5 ./tests/es5.js ./tests/es5-2.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err.stack)
      console.error(stdout.toString())
      console.error(stderr.toString())
      done(err)
      return
    }
    done()
  })
})

it('🎉  Es Check should pass when checking a file with a hash bang', (done) => {
  exec('node index.js es6 ./tests/scripts/hash-bang.js --allow-hash-bang', (err, stdout, stderr) => {
    if (err) {
      console.error(err.stack)
      console.error(stdout.toString())
      console.error(stderr.toString())
      done(err)
      return
    }
    done()
  })
})

it('👌  Es Check should fail when checking an array of es6 files as es5', (done) => {
  exec('node index.js es5 ./tests/es6.js ./tests/es6-2.js', (err, stdout, stderr) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('🎉  Es Check should pass when checking a glob of es6 files as es6', (done) => {
  exec('node index.js es6 "./tests/es6.js"', (err, stdout, stderr) => {
    if (err) {
      console.error(err.stack)
      console.error(stdout.toString())
      console.error(stderr.toString())
      done(err)
      return
    }
    done()
  })
})

it('👌  Es Check fails when give an invalid version', (done) => {
  exec('node index.js foo "./tests/*.js"', (err, stdout, stderr) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('👌  Es Check should fail when checking a glob of es6 files as es5', (done) => {
  exec('node index.js es5 "./tests/*.js"', (err, stdout, stderr) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('👌  Es Check should fail when given a glob that matches no files', (done) => {
  exec('node index.js es5 foo-bar.js', (err, stdout, stderr) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('👌  Es Check should fail when given a glob that matches files and a glob that does not', (done) => {
  exec('node index.js es5 ./tests/es5.js foo-bar.js', (err, stdout, stderr) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('👌  Es Check should fail when checking a glob of es6 modules without --module flag', (done) => {
  exec('node index.js es6 ./tests/modules/*.js', (err, stdout) => {
    assert(err)
    console.log(stdout)
    done()
  })
})

it('🎉  Es Check should pass when checking a glob of es6 modules using the --module flag', (done) => {
  exec('node index.js es6 ./tests/modules/*.js --module', (err, stdout, stderr) => {
    assert(stdout)
    if (err) {
      console.error(err.stack)
      console.error(stdout.toString())
      console.error(stderr.toString())
      done(err)
      return
    }
    done()
  })
})

it('🎉  Es Check should pass when checking a glob of es6 modules using the --module flag in another order', (done) => {
  exec('node index.js es6 ./tests/modules/*.js --module --no-color', (err, stdout, stderr) => {
    assert(stdout)
    if (err) {
      console.error(err.stack)
      console.error(stdout.toString())
      console.error(stderr.toString())
      done(err)
      return
    }
    done()
  })
})

it('🎉  Es Check should fail when checking a glob of es6 modules using the --module flag in any order', (done) => {
  exec('node index.js es6 --module ./tests/modules/*.js', (err, stdout) => {
    /**
     * @notes 🐛
     * This test should fail but doesn't as expected.
     * The module flag will default to `falsy` and then not throw an error if an argument is addeed after it.
     * This issue exists with Caporal and will be fixed in the next major release by switching to another CLI tool,
     */
    assert(!err)
    console.log(err, stdout)
    done()
  })
})

it('👌 Es Check should read from an .escheckrc file for config', (done) => {
  // Create basic config file
  const config = {
    ecmaVersion: 'es5',
    files: './tests/es5.js'
  };
  fs.writeFileSync('.escheckrc', JSON.stringify(config));

  exec('node index.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err.stack);
      console.error(stdout.toString());
      console.error(stderr.toString());
      done(err);
      return;
    }
    done();
  });
})

describe('Es Check skips folders and files included in the not flag', () => {
  afterEach(() => {
    if (fs.existsSync('.escheckrc')) {
      fs.unlinkSync('.escheckrc');
    }
  });

  it('👌  non-glob', (done) => {
    exec('node index.js es5 ./tests/es5.js ./tests/modules/* --not=./tests/modules', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack)
        console.error(stdout.toString())
        console.error(stderr.toString())
        done(err)
        return
      }
      done()
    })
  })

  it('👌  glob', (done) => {
    exec('node index.js es5 ./tests/es5.js ./tests/modules/* --not=./tests/modules/*', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack)
        console.error(stdout.toString())
        console.error(stderr.toString())
        done(err)
        return
      }
      done()
    })
  })

  it('👌  mixed glob & non-glob', (done) => {
    exec(
      'node index.js es5 ./tests/es5.js ./tests/modules/* ./tests/passed/* --not=./tests/passed,./tests/modules/*',
      (err, stdout, stderr) => {
        if (err) {
          console.error(err.stack)
          console.error(stdout.toString())
          console.error(stderr.toString())
          done(err)
          return
        }
        done()
      },
    )
  })

  it('👌  .escheckrc', (done) => {
    const config = {
      ecmaVersion: 'es5',
      files: ['./tests/es5.js', './tests/skipped/es6-skipped.js'],
      not: ['./tests/skipped/*']
    };
    fs.writeFileSync('.escheckrc', JSON.stringify(config));

    exec('node index.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      done();
    });
  })
})

describe('Es Check supports the --files flag', () => {
  it('🎉  Es Check should pass when checking a glob with es6 modules as es6 using the --files flag', (done) => {
    exec('node index.js es6 --files=./tests/es6.js', (err, stdout, stderr) => {
      assert(stdout)
      if (err) {
        console.error(err.stack)
        console.error(stdout.toString())
        console.error(stderr.toString())
        done(err)
        return
      }
      done()
    })
  })

  it('👌  Es Check should fail when checking a glob with es6 modules as es5 using the --files flag', (done) => {
    exec('node index.js es5 --files=./tests/es6.js', (err, stdout, stderr) => {
      assert(err)
      console.log(stdout)
      done()
    })
  })

  it('👌  Es Check should fail when given both spread files and --files flag', (done) => {
    exec('node index.js es6 ./tests/es6.js --files=./tests/es6.js', (err, stdout, stderr) => {
      assert(err)
      console.log(stdout)
      done()
    })
  })
})

describe('Es Check supports the es2018 flag', () => {
  it('🎉  Es Check should pass when checking a file with es2018 syntax as es2018', (done) => {
    exec('node index.js es2018 ./tests/es2018.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack)
        console.error(stdout.toString())
        console.error(stderr.toString())
        done(err)
        return
      }
      done()
    })
  })
  it('👌 Es Check should fail when versions belows es2018 use version es2018+ features', (done) => {
    exec('node index.js es6 ./tests/es2018.js --checkFeatures', (err, stdout, stderr) => {
      console.log({ err, stdout, stderr })
      assert(err)
      done()
    })
  });
});

describe('ES7 / ES2016 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES7 file as es7', (done) => {
    exec('node index.js es7 ./tests/es7.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES7 file as es6', (done) => {
    exec('node index.js es6 ./tests/es7.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES10 / ES2019 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES10 file as es10', (done) => {
    exec('node index.js es10 ./tests/es10.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES10 file as es6', (done) => {
    exec('node index.js es6 ./tests/es10.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES11 / ES2020 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES11 file as es11', (done) => {
    exec('node index.js es11 ./tests/es11.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES11 file as es6', (done) => {
    exec('node index.js es6 ./tests/es11.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES12 / ES2021 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES12 file as es12', (done) => {
    exec('node index.js es12 ./tests/es12.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES12 file as es6', (done) => {
    exec('node index.js es6 ./tests/es12.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES6 / Proxy Feature Tests', () => {
  it('👌  Es Check should fail when checking a file with `new Proxy(...)` as es5', (done) => {
    exec('node index.js es5 ./tests/proxy.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });

  it('🎉  Es Check should pass when checking a file with `new Proxy(...)` as es6', (done) => {
    exec('node index.js es6 ./tests/proxy.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });
});

describe('Array Configuration', () => {
  beforeEach(() => {
    if (!fs.existsSync('tests/es5')) {
      fs.mkdirSync('tests/es5', { recursive: true });
    }
    if (!fs.existsSync('tests/module')) {
      fs.mkdirSync('tests/module', { recursive: true });
    }
    fs.writeFileSync('tests/es5/valid.js', 'var foo = "bar";');
    fs.writeFileSync('tests/module/valid.js', 'export const foo = "bar";');
  });

  afterEach(() => {
    if (fs.existsSync('.escheckrc')) {
      fs.unlinkSync('.escheckrc');
    }
    if (fs.existsSync('tests/es5')) {
      fs.rmSync('tests/es5', { recursive: true, force: true });
    }
    if (fs.existsSync('tests/module')) {
      fs.rmSync('tests/module', { recursive: true, force: true });
    }
  });

  it('should support multiple configurations in .escheckrc', (done) => {
    const config = [
      {
        ecmaVersion: 'es5',
        files: './tests/es5/valid.js'
      },
      {
        ecmaVersion: 'es6',
        module: true,
        files: './tests/module/valid.js'
      }
    ];
    fs.writeFileSync('.escheckrc', JSON.stringify(config));

    exec('node index.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should indicate successful check');
      done();
    });
  });
});
