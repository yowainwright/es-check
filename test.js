'use strict';

const exec = require('child_process').exec;
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateBashCompletion, generateZshCompletion } = require('./utils');

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

  it('👌 Es Check should fail when using --checkBrowser without browserslistQuery', (done) => {
    exec('node index.js --checkBrowser --files=./tests/checkbrowser/es6.js', (err, stdout, stderr) => {
      assert(err, 'Expected an error but command ran successfully');
      const output = stdout.toString() + stderr.toString();
      assert(output.includes('When using --checkBrowser, you must also provide a --browserslistQuery'),
        'Should show error related to missing browserslist query');
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
});
