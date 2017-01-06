'use strict';

var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var cache = {};

module.exports = { get: get, set: set, push: push, clear: clear };

function get(key, valueKey) {
  return valueKey ? cache[key][valueKey] : cache[key];
}

function set(key, valueKey, values) {
  cache[key] = cache[key] || {};
  _.forEach(_.castArray(values), function (val) {
    return cache[key][val[valueKey]] = val;
  });
}

function push(key, values) {
  cache[key] = (cache[key] || []).concat(_.castArray(values));
}

function clear() {
  cache = {};
}