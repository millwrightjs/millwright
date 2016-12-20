const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const cache = {};

module.exports = {get, set, push};

function get(key, valueKey) {
  return valueKey ? cache[key][valueKey] : cache[key];
}

function set(key, valueKey, values) {
  cache[key] = cache[key] || {};
  _.forEach(_.castArray(values), val => cache[key][val[valueKey]] = val);
}

function push(key, values) {
  cache[key] = (cache[key] || []).concat(_.castArray(values));
}
