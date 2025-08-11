'use strict';

const exec = require('child_process').exec;
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateBashCompletion, generateZshCompletion } = require('./utils');

const generatedFixturesRoot = path.join(process.cwd(), 'fixtures');

function createUniqueConfigFile(config, testName) {
  const hash = crypto.createHash('md5').update(testName).digest('hex').substring(0, 8);
  const configFileName = `.escheckrc.${hash}`;
  fs.writeFileSync(configFileName, JSON.stringify(config));
  return configFileName;
}

function removeConfigFile(configFileName) {
  if (fs.existsSync(configFileName)) {
    fs.unlinkSync(configFileName);
  }
}

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
  const configFileName = createUniqueConfigFile(config, 'read-from-escheckrc');

  exec(`node index.js --config=${configFileName}`, (err, stdout, stderr) => {
    // Clean up the config file
    removeConfigFile(configFileName);

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
  // No need for afterEach to clean up .escheckrc as we're using unique config files

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
    const configFileName = createUniqueConfigFile(config, 'not-flag-escheckrc');

    exec(`node index.js --config=${configFileName}`, (err, stdout, stderr) => {
      // Clean up the config file
      removeConfigFile(configFileName);

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

describe('ES13 / ES2022 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES13 file as es13', (done) => {
    exec('node index.js es13 ./tests/es13.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('🎉  Es Check should pass when checking an ES13 file as es2022', (done) => {
    exec('node index.js es2022 ./tests/es13.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES13 file as es6', (done) => {
    exec('node index.js es6 ./tests/es13.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES14 / ES2023 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES14 file as es14', (done) => {
    exec('node index.js es14 ./tests/es14.js --checkFeatures --allow-hash-bang', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('🎉  Es Check should pass when checking an ES14 file as es2023', (done) => {
    exec('node index.js es2023 ./tests/es14.js --checkFeatures --allow-hash-bang', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES14 file as es6', (done) => {
    exec('node index.js es6 ./tests/es14.js --checkFeatures --allow-hash-bang', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES15 / ES2024 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES15 file as es15', (done) => {
    exec('node index.js es15 ./tests/es15.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('🎉  Es Check should pass when checking an ES15 file as es2024', (done) => {
    exec('node index.js es2024 ./tests/es15.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES15 file as es6', (done) => {
    exec('node index.js es6 ./tests/es15.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });
});

describe('ES16 / ES2025 Feature Tests', () => {
  it('🎉  Es Check should pass when checking an ES16 file as es16', (done) => {
    exec('node index.js es16 ./tests/es16.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('🎉  Es Check should pass when checking an ES16 file as es2025', (done) => {
    exec('node index.js es2025 ./tests/es16.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking an ES16 file as es6', (done) => {
    exec('node index.js es6 ./tests/es16.js --checkFeatures', (err, stdout, stderr) => {
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

describe('ES6 / Promise', () => {
  it('👌  Es Check should fail when checking a file with `new Promise(...)` as es5', (done) => {
    exec('node index.js es5 ./tests/promise.new.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });

  it('🎉  Es Check should pass when checking a file with `new Promise(...)` as es6', (done) => {
    exec('node index.js es6 ./tests/promise.new.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking a file with `Promise.resolve(...)` as es5', (done) => {
    exec('node index.js es5 ./tests/promise.resolve.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });

  it('🎉  Es Check should pass when checking a file with `Promise.resolve(...)` as es6', (done) => {
    exec('node index.js es6 ./tests/promise.resolve.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        return done(err);
      }
      done();
    });
  });

  it('👌  Es Check should fail when checking a file with `Promise.reject(...)` as es5', (done) => {
    exec('node index.js es5 ./tests/promise.reject.js --checkFeatures', (err, stdout, stderr) => {
      console.log(stdout);
      assert(err, 'Expected an error but command ran successfully');
      done();
    });
  });

  it('🎉  Es Check should pass when checking a file with `Promise.reject(...)` as es6', (done) => {
    exec('node index.js es6 ./tests/promise.reject.js --checkFeatures', (err, stdout, stderr) => {
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
    const configFileName = createUniqueConfigFile(config, 'multiple-configurations');

    exec(`node index.js --config=${configFileName}`, (err, stdout, stderr) => {
      removeConfigFile(configFileName);

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

describe('CheckBrowser Tests', () => {
  it('🎉 Es Check should pass when using --checkBrowser without specifying ES version', (done) => {
    exec('node index.js es6 --checkBrowser --browserslistQuery="Chrome >= 100" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
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

  it('🎉 Es Check should pass when using "checkBrowser" as ES version', (done) => {
    exec('node index.js checkBrowser --browserslistQuery="Chrome >= 100" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
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

  it('🎉 Es Check should pass when using only --checkBrowser flag without ES version', (done) => {
    exec('node index.js --checkBrowser --browserslistQuery="Chrome >= 100" --files=./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
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

  it('🎉 Es Check should pass when using --files with --checkBrowser without ES version', (done) => {
    exec('node index.js --checkBrowser --browserslistQuery="Chrome >= 100" --files=./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
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

  it('👌 Es Check should fail when ES6 file is checked against ES5 browsers', (done) => {
    exec('node index.js es6 --checkBrowser --browserslistQuery="IE 11" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      console.log(stdout);
      done();
    });
  });

  it('👌 Es Check should fail when ES6 file is checked against ES5 browsers using only --checkBrowser', (done) => {
    exec('node index.js --checkBrowser --browserslistQuery="IE 11" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      console.log(stdout);
      done();
    });
  });

  it('🎉 Es Check should pass when ES2020 file is checked against modern browsers', (done) => {
    exec('node index.js es2020 --checkBrowser --browserslistQuery="Chrome >= 85" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      done();
    });
  });

  it('👌 Es Check should fail when ES2020 file is checked against older browsers', (done) => {
    exec('node index.js es6 --checkBrowser --browserslistQuery="Chrome >= 60, Firefox >= 60" ./tests/checkbrowser/es2020.js --checkFeatures', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      console.log(stdout);
      done();
    });
  });
});

describe('Shell Completion', () => {
  // CLI Integration Tests
  describe('CLI Commands', () => {
    it('should generate bash completion script', (done) => {
      exec('node index.js completion', (err, stdout, stderr) => {
        if (err) {
          console.error(err.stack);
          console.error(stdout.toString());
          console.error(stderr.toString());
          done(err);
          return;
        }

        // Check for key elements in the bash completion script
        assert(stdout.includes('_es_check_completion()'), 'Should include completion function');
        assert(stdout.includes('es_versions='), 'Should include ES versions');
        assert(stdout.includes('complete -F _es_check_completion'), 'Should include complete command');

        done();
      });
    });

    it('should generate zsh completion script', (done) => {
      exec('node index.js completion zsh', (err, stdout, stderr) => {
        if (err) {
          console.error(err.stack);
          console.error(stdout.toString());
          console.error(stderr.toString());
          done(err);
          return;
        }

        // Check for key elements in the zsh completion script
        assert(stdout.includes('#compdef es-check'), 'Should include compdef directive');
        assert(stdout.includes('_es_check()'), 'Should include completion function');
        assert(stdout.includes('es_versions=('), 'Should include ES versions');

        done();
      });
    });

    it('should show error for unsupported shell', (done) => {
      exec('node index.js completion unsupported-shell', (err, stdout, stderr) => {
        assert(err, 'Should exit with error');
        assert(stderr.includes('not supported for completion'), 'Should show error message for unsupported shell');
        done();
      });
    });
  });

  // Unit Tests for Utility Functions
  describe('Utility Functions', () => {
    describe('generateBashCompletion', () => {
      it('should generate bash completion script', () => {
        const cmdName = 'test-cmd';
        const commands = ['completion', 'help'];
        const options = ['module', 'files', 'verbose'];

        const script = generateBashCompletion(cmdName, commands, options);

        assert(script.includes(`_${cmdName.replace(/-/g, '_')}_completion()`), 'Should include completion function');
        assert(script.includes('es_versions='), 'Should include ES versions');
        assert(script.includes(`complete -F _${cmdName.replace(/-/g, '_')}_completion ${cmdName}`), 'Should include complete command');

        commands.forEach(cmd => {
          assert(script.includes(cmd), `Should include command: ${cmd}`);
        });

        options.forEach(opt => {
          assert(script.includes(`--${opt}`), `Should include option: --${opt}`);
        });
      });

      it('should handle empty commands and options arrays', () => {
        const script = generateBashCompletion('test-cmd', [], []);

        assert(script.includes('_test_cmd_completion()'), 'Should include completion function');
        assert(script.includes('cmds=""') || script.includes('cmds=()'), 'Should handle empty commands');
        assert(script.includes('opts=""') || script.includes('opts=()'), 'Should handle empty options');
      });

      it('should handle command names with hyphens', () => {
        const script = generateBashCompletion('test-cmd', ['help'], ['verbose']);

        assert(script.includes('_test_cmd_completion()'), 'Should convert hyphens to underscores in function name');
        assert(script.includes('complete -F _test_cmd_completion test-cmd'),
          'Should use original command name in complete directive');
      });
    });

    describe('generateZshCompletion', () => {
      it('should generate zsh completion script', () => {
        const cmdName = 'test-cmd';
        const commands = ['completion', 'help'];
        const options = ['module', 'files', 'verbose'];

        const script = generateZshCompletion(cmdName, commands, options);

        assert(script.includes(`#compdef ${cmdName}`), 'Should include compdef directive');
        assert(script.includes(`_${cmdName.replace(/-/g, '_')}()`), 'Should include completion function');
        assert(script.includes('es_versions=('), 'Should include ES versions');

        commands.forEach(cmd => {
          assert(script.includes(`"${cmd}:`), `Should include command: ${cmd}`);
        });

        options.forEach(opt => {
          assert(script.includes(`"--${opt}[`), `Should include option: --${opt}`);
        });
      });

      it('should handle empty commands and options arrays', () => {
        const script = generateZshCompletion('test-cmd', [], []);

        assert(script.includes('_test_cmd()'), 'Should include completion function');
        assert(script.includes('commands=('), 'Should include commands array');
        assert(script.includes('options=('), 'Should include options array');
      });

      it('should handle command names with hyphens', () => {
        const script = generateZshCompletion('test-cmd', ['help'], ['verbose']);

        assert(script.includes('_test_cmd()'), 'Should convert hyphens to underscores in function name');
        assert(script.includes('#compdef test-cmd'), 'Should use original command name in compdef directive');
      });
    });
  });

  describe('🔬 Limited Tests for Addressed Scenarios (No New Files Constraint)', () => {
    it('🎉 Should run with "checkBrowser" and an existing ES5 file, relying on browserslist default or ancestor configs', (done) => {
      exec('node index.js checkBrowser ./tests/es5.js', (err, stdout, stderr) => {
        if (err) {
          console.error(err.stack);
          console.error(stdout.toString());
          console.error(stderr.toString());
          done(err);
          return;
        }
        assert(stdout.includes('no ES version matching errors'), 'ES5 file should pass with default browserslist behavior.');
        done();
      });
    });

    it('🎉 Should use --browserslistQuery from CLI with --checkBrowser, effectively overriding a positional esVersion', (done) => {
      exec('node index.js es5 --checkBrowser --browserslistQuery="Chrome >= 100" ./tests/es6.js', (err, stdout, stderr) => {
        if (err) {
          console.error(err.stack);
          console.error(stdout.toString());
          console.error(stderr.toString());
          done(err);
          return;
        }
        assert(stdout.includes('no ES version matching errors'), 'ES6 file should pass when --checkBrowser and a modern --browserslistQuery are used.');
        done();
      });
    });
  });
});

describe('🧪 Programmatic API Tests', () => {
  const { runChecks, loadConfig } = require('./index.js');
  const { createLogger } = require('./utils');

  it('✅ Should expose runChecks function', () => {
    assert(typeof runChecks === 'function', 'runChecks should be a function');
  });

  it('✅ Should expose loadConfig function', () => {
    assert(typeof loadConfig === 'function', 'loadConfig should be a function');
  });

  it('✅ Should run checks programmatically with valid config', async () => {
    const testConfig = {
      ecmaVersion: 'es5',
      files: ['./tests/es5.js'],
      module: false,
      allowHashBang: false,
      checkFeatures: false
    };

    const logger = createLogger({ silent: true });

    try {
      await runChecks([testConfig], logger);
      assert(true, 'runChecks should complete without errors for valid ES5 file');
    } catch (error) {
      throw new Error('runChecks failed unexpectedly: ' + error.message);
    }
  });

  it('✅ Should fail programmatically when ES6 features found in ES5 check', async () => {
    const testConfig = {
      ecmaVersion: 'es5',
      files: ['./tests/es6.js'],
      module: false,
      allowHashBang: false,
      checkFeatures: false
    };

    const logger = createLogger({ silent: true });
    let errorCaught = false;

    const originalExit = process.exit;
    process.exit = (code) => {
      if (code === 1) {
        errorCaught = true;
      }
    };

    try {
      await runChecks([testConfig], logger);
    } catch (error) {
      errorCaught = true;
    }

    process.exit = originalExit;
    assert(errorCaught, 'runChecks should fail for ES6 file checked as ES5');
  });

  it('✅ Should load config from file system', async () => {
    const configs = await loadConfig();
    assert(Array.isArray(configs), 'loadConfig should return an array');
  });
});

describe('🔬 Fixture-Based Tests for Addressed Scenarios', () => {

  before(() => {
    if (fs.existsSync(generatedFixturesRoot)) {
      fs.rmSync(generatedFixturesRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(generatedFixturesRoot, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(generatedFixturesRoot)) {
      fs.rmSync(generatedFixturesRoot, { recursive: true, force: true });
    }
  });

  describe('Auto-loading package.json for browserslist', () => {
    it('👌 Should auto-load browserslist from a generated package.json and fail for incompatible ES version', (done) => {
      const scenarioDirName = 's1_pkg_json_fixture';
      const testDir = path.join(generatedFixturesRoot, scenarioDirName);
      fs.mkdirSync(testDir, { recursive: true });

      const es6JsContent = 'const myVar = 123; let another = () => myVar;';
      fs.writeFileSync(path.join(testDir, 'uses_es6.js'), es6JsContent);

      const packageJsonContent = {
        name: "s1-fixture-pkg",
        version: "1.0.0",
        browserslist: ["IE 11"]
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJsonContent));

      const pathToIndexJs = path.relative(testDir, path.join(process.cwd(), 'index.js'));
      const targetJsFile = 'uses_es6.js';

      exec(`node ${pathToIndexJs} checkBrowser ${targetJsFile}`, { cwd: testDir }, (err) => {
        assert(err, 'Expected es-check to fail (ES6 file vs IE 11 from generated package.json).');
        done();
      });
    });
  });

  describe('Comma-separated files string from config', () => {
    it('👌 Should process comma-separated files string from a generated .escheckrc and fail if one file is non-compliant', (done) => {
      const scenarioJsFilesDirName = 's3_js_files_fixture';
      const jsFilesDir = path.join(generatedFixturesRoot, scenarioJsFilesDirName);
      fs.mkdirSync(jsFilesDir, { recursive: true });

      const es5JsContent = 'var testVar = "ES5 content";';
      const es6JsContent = 'const testConst = "ES6 content"; let testLet = true;';
      fs.writeFileSync(path.join(jsFilesDir, 'actual_es5.js'), es5JsContent);
      fs.writeFileSync(path.join(jsFilesDir, 'actual_es6.js'), es6JsContent);

      const es5RelPath = path.join(path.basename(generatedFixturesRoot), scenarioJsFilesDirName, 'actual_es5.js');
      const es6RelPath = path.join(path.basename(generatedFixturesRoot), scenarioJsFilesDirName, 'actual_es6.js');

      const configForS3 = {
        ecmaVersion: 'es5',
        files: `${es5RelPath}, ${es6RelPath}`
      };
      const configFileName = createUniqueConfigFile(configForS3, 's3_comma_files_rc');

      exec(`node index.js --config=${configFileName}`, (err, stdout, stderr) => {
        removeConfigFile(configFileName);

        assert(err, 'Expected es-check to fail because actual_es6.js (ES6) was checked as ES5.');
        assert(stdout.includes('actual_es6.js') && (stdout.includes('ES version matching errors') || stderr.includes('ES version matching errors')), 'Error output should mention the non-compliant ES6 file.');
        done();
      });
    });
  });

  describe('CLI options merge with file config for browserslist (using createUniqueConfigFile)', () => {
    it('👌 Should use browserslistQuery from .escheckrc when CLI provides --files', (done) => {
      const es6TestFile = './tests/checkbrowser/es6.js';
      const config = {
        ecmaVersion: 'checkBrowser',
        browserslistQuery: 'IE 11'
      };
      const configFileName = createUniqueConfigFile(config, 's2_cli_merge_rc_fixture');

      exec(`node index.js --config=${configFileName} --files=${es6TestFile}`, (err) => {
        removeConfigFile(configFileName);
        assert(err, `Expected es-check to fail (ES6 file ${es6TestFile} vs "IE 11" from ${configFileName}).`);
        done();
      });
    });
  });

  it('🎉 should PASS when --checkBrowser is used with a single positional file argument', (done) => {
    exec('node index.js --checkBrowser --browserslistQuery="Chrome >= 100" ./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
      if (err) {
        console.error('Test failed unexpectedly:');
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when checking a SCRIPT file (es6.js) with --checkBrowser', (done) => {
    const command = 'node index.js --checkBrowser --browserslistQuery="Chrome >= 100" ./tests/checkbrowser/es6.js';
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test for es6.js failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when checking a MODULE file (es2020.js) by setting the version explicitly', (done) => {
    const command = 'node index.js es2020 --module ./tests/checkbrowser/es2020.js';
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test for es2020.js failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when file argument is passed before the --checkBrowser flag', (done) => {
    const command = 'node index.js ./tests/checkbrowser/es6.js --checkBrowser --browserslistQuery="Chrome >= 100"';

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when file argument is passed before the --checkBrowser flag', (done) => {
    const command = 'node index.js checkBrowser ./tests/checkbrowser/es6.js --browserslistQuery="Chrome >= 100"';

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when file argument is passed before the --checkBrowser flag', (done) => {
    const command = 'node index.js --checkBrowser ./tests/checkbrowser/es6.js --browserslistQuery="Chrome >= 100"';

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });

  it('🎉 should PASS when file argument is passed before the --checkBrowser flag', (done) => {
    const command = 'node index.js --checkBrowser ./tests/checkbrowser/es6.js';

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Test failed unexpectedly:', stdout, stderr);
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'), 'Should pass successfully');
      done();
    });
  });
});

describe('--batchSize option tests', () => {
  it('🎉 Es Check should pass with --batchSize 0 (unlimited)', (done) => {
    exec('node index.js es5 ./tests/es5.js ./tests/es5-2.js --batchSize 0', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Es Check should pass with --batchSize 1 (process one at a time)', (done) => {
    exec('node index.js es5 ./tests/es5.js ./tests/es5-2.js --batchSize 1', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Es Check should pass with --batchSize 10', (done) => {
    exec('node index.js es5 ./tests/es5*.js --batchSize 10', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('👌 Es Check should fail correctly with --batchSize option when ES6 files checked as ES5', (done) => {
    exec('node index.js es5 ./tests/es6.js ./tests/es6-2.js --batchSize 1', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      const output = stdout + stderr; // Check both stdout and stderr
      assert(output.includes('ES version matching errors') || output.includes('ES-Check: there were'), 
        'Output should contain error message');
      done();
    });
  });

  it('🎉 Es Check should handle mixed file results with batching', (done) => {
    exec('node index.js es6 ./tests/es5.js ./tests/es6.js --batchSize 2', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });
});

describe('Performance optimization integration tests', () => {
  it('🎉 Should reuse AST when --checkFeatures is enabled', (done) => {
    // This test verifies that the AST is reused (single parse optimization)
    exec('node index.js es6 ./tests/es6.js --checkFeatures', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Should work with async file processing', (done) => {
    // Test that async file reading works correctly
    exec('node index.js es5 ./tests/es5.js ./tests/es5-2.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Should handle large file sets with batching', (done) => {
    // Test with multiple files to ensure batch processing works
    exec('node index.js es6 "./tests/*.js" --batchSize 5 --not=./tests/es7.js,./tests/es8.js,./tests/es9.js,./tests/es10.js,./tests/es11.js,./tests/es12.js,./tests/es13.js,./tests/es14.js,./tests/es15.js,./tests/es16.js,./tests/es2018.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Should work with config file containing batchSize', (done) => {
    // Create a temporary config file
    const fs = require('fs');
    const configPath = './.test-escheckrc';
    const config = {
      ecmaVersion: 'es5',
      files: ['./tests/es5.js'],
      batchSize: 2
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config));
    
    exec(`node index.js --config ${configPath}`, (err, stdout, stderr) => {
      // Clean up config file
      fs.unlinkSync(configPath);
      
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });
});

describe('--cache option tests', () => {
  it('🎉 Es Check should pass with cache enabled (default)', (done) => {
    exec('node index.js es5 ./tests/es5.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Es Check should pass with cache explicitly disabled', (done) => {
    exec('node index.js es5 ./tests/es5.js --noCache', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Es Check should handle duplicate files with cache', (done) => {
    exec('node index.js es5 ./tests/es5.js ./tests/es5.js ./tests/es5-2.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('👌 Es Check should fail correctly with cache when checking ES6 as ES5', (done) => {
    exec('node index.js es5 ./tests/es6.js ./tests/es6-2.js', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      const output = stdout + stderr;
      assert(output.includes('ES version matching errors') || output.includes('ES-Check: there were'), 
        'Output should contain error message');
      done();
    });
  });

  it('🎉 Es Check should work with cache in config file', (done) => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '.test-escheckrc');
    const config = {
      ecmaVersion: 'es5',
      files: ['./tests/es5.js'],
      cache: true
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config));
    
    exec(`node index.js --config ${configPath}`, (err, stdout, stderr) => {
      fs.unlinkSync(configPath);
      
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });

  it('🎉 Es Check should work with cache disabled in config file', (done) => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '.test-escheckrc');
    const config = {
      ecmaVersion: 'es5',
      files: ['./tests/es5.js'],
      cache: false
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config));
    
    exec(`node index.js --config ${configPath}`, (err, stdout, stderr) => {
      fs.unlinkSync(configPath);
      
      if (err) {
        console.error(err.stack);
        console.error(stdout.toString());
        console.error(stderr.toString());
        done(err);
        return;
      }
      assert(stdout.includes('no ES version matching errors'));
      done();
    });
  });
});
