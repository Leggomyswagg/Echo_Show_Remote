const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { createRequire } = require('node:module');

module.exports = function loadTs(filename, { mocks = {}, globals = {} } = {}) {
  const root = path.join(__dirname, '..');
  const absolute = path.join(root, filename);
  const localRequire = createRequire(absolute);
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports: module.exports, module,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      const relativeTs = path.resolve(path.dirname(absolute), name) + '.ts';
      if (name.startsWith('.') && fs.existsSync(relativeTs)) {
        return loadTs(path.relative(root, relativeTs), { mocks, globals });
      }
      return localRequire(name);
    },
    Buffer, AbortController, AbortSignal, setTimeout, clearTimeout,
    process: { env: {} }, console,
    ...globals,
  }, { filename });
  return module.exports;
};
