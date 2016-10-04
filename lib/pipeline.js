const path = require('path');
const _ = require('./util/lodash-extended');
const promisify = require('promisify-node');
const fs = promisify('fs-extra');

module.exports = function(group) {
  return _(group)
    .map(read)
    .mapAsyncIf(shouldCompile, compile)
    .value();
}

function read(_path) {
  return fs.readFile(_path, 'utf8');
}

function shouldCompile(asset) {
  const types = ['sass', 'scss', 'less', 'styl', 'coffee'];
  return !asset.src.pathMinExists && types.includes(asset.src.type);
}

function shouldPostProcessType(type) {
  return ['css'].includes(type);
}

function shouldMinifyType(type) {
  return ['css', 'js'].includes(type);
}

function shouldConcatType(type) {
  return shouldMinifyType(type);
}
