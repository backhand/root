'use strict';

/* Module imports */
const path = require('path');
const fs   = require('fs');

/* Module exports */
module.exports = RootFactory;

/* Module contents */
function RootFactory(rootDir, options = {}) {
  if (!rootDir[0] === '/') {
    throw new Error('Root dir must be absolute');
  }

  const r = Symbol('root-properties');

  function Root() {
    set('rootDir', rootDir);

    // Settings
    set('recursive', typeof options.recursive === 'undefined' ? true : !!options.recursive);
    set('ignore',    options.ignore || []);
    if (!Array.isArray(get('ignore')) || !get('ignore').every((e) => typeof e.test === 'function')) {
      throw Error(`Option 'ignore' must be an array of RegExps`);
    }

    // Methods
    set('isIgnored', (item) => item[0] === '.' || get('ignore').some((regexp) => regexp.test(item)));

    // Start scanning from the top
    scan(get('rootDir'), this);
  }

  function set(key, value) {
    if (!Root[r]) {
      def(Root, r, {});
    }
    def(Root[r], key, value);
  }

  function get(key) {
    return Root[r][key];
  }

  const extensions = ['.js', '.json'];
  function scan(dir, obj, level = 0) {
    fs.readdirSync(dir).filter((item) => {
      // Check whether item is ignored
      if (!item || get('isIgnored')(item)) {
        return;
      }

      // Absolute path to item
      const itemPath = path.join(dir, item);

      // Skip main file if we come across it - would just lead to irrelevant circular references
      if (require.main.filename === itemPath) {
        return;
      }

      const itemStat = fs.statSync(path.join(dir, item));

      // Check if file or directory
      if (itemStat.isFile()) {
        const fileExtension = path.extname(item);
        if (extensions.includes(fileExtension)) {
          const itemName = path.basename(item, fileExtension);
          def(obj, itemName, getModuleLoader(itemPath), { enumerable: true }, true);
        }
      } else if (itemStat.isDirectory()) {
        if (get('recursive') || level === 0) {
          // Set sub-property on given obj
          if (!obj[item]) {
            def(obj, item, {}, { enumerable: true });
          }

          // Scan from subdirectory and with new sub-property
          scan(itemPath, obj[item], level + 1);
        }
      }
    });
  }

  function getModuleLoader(modulePath) {
    return () => require(modulePath);
  }

  return new Root(rootDir, options);
}

/* Module helper functions */
function def(obj, key, valueOrGetter, options = {}, isGetter = false) {
  const definition = Object.assign({
    enumerable: false,
    configurable: false
  }, options);

  if (isGetter) {
    definition.get = valueOrGetter;
  } else {
    definition.value = valueOrGetter;
    definition.writable = false;
  }

  Object.defineProperty(obj, key, definition);
}
