const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const cache = {};

module.exports = {get, dump};

function get(file, transformer) {
  const resolved = path.resolve(file);
  const result = cache[resolved] || set(resolved, transformer);
  return _.isObject(result) ? _.assign({}, result) : result;
}

function set(file, transformer) {
  const isJson = path.extname(file) === '.json';
  const readFn = isJson ? fs.readJsonSync : fs.readFileSync;
  const defaultValue = isJson ? {} : '';

  if (!file) {
    return defaultValue;
  }

  cache[file] = _.attemptSilent(readFn, file, 'utf8') || defaultValue;

  if (transformer) {
    cache[file] = transformer(cache[file]);
  }

  return cache[file];
}

function dump() {
  return _.assign({}, cache);
}
