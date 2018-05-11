'use strict';

const root   = require('..');
const assert = require('assert');

describe('root', function() {
  it('should recursively build a root namespace object from test directory', () => {
    const rootObj = root(__dirname, {
      ignore: [/test/, /ignoreme/]
    });

    assert.ok(rootObj.liba);
    assert.ok(rootObj.liba.libb);
    assert.ok(rootObj.libc);
    assert.ok(rootObj.libd);
    assert.ok(rootObj.libd.isLoaded);
    assert.ok(!rootObj.ignoreme);
  });
}); // End describe root
