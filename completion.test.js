'use strict';

const exec = require('child_process').exec;
const assert = require('assert');

describe('Shell Completion', () => {
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
