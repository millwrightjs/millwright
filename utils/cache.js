const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const cache = {};

module.exports = {get};

function get(file) {
  const result = cache[file] || add(file);
  return _.isObject(result) ? _.assign({}, result) : result;
}

function add(file) {
  const resolved = path.resolve(file);
  const isJson = path.extname(resolved) === '.json';
  const readFn = isJson ? fs.readJsonSync : fs.readFileSync;
  const defaultValue = isJson ? {} : '';

  if (!file) {
    return defaultValue;
  }

  cache[resolved] = _.attemptSilent(readFn, resolved, 'utf8') || defaultValue;
  return cache[resolved];
}
