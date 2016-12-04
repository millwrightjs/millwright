const _ = require('lodash');
const path = require('path');
const pathExists = require('path-exists');

module.exports = {
  getCompiledType,
  getOrdinal,
  getType,
  whicheverExists,
  stripIgnoredBasePath,
  changeExt
};

function getCompiledType(type) {
  // Accept an object with a 'type' property, or else assume a string
  type = _.get(type, 'type') || type;

  const typeMap = {
    css: ['sass', 'less', 'stylus'],
    js: ['coffee']
  }
  return _.findKey(typeMap, types => _.includes(types, type));
}

function getOrdinal(num) {
  if((parseFloat(num) === parseInt(num)) && !isNaN(num)) {
    var suffixes=["th","st","nd","rd"];
    var remainder = num % 100;
    return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
  }
  return num;
}

function getType(ext) {
  const typeMap = {
    js: 'js',
    css: 'css',
    scss: 'sass',
    less: 'less',
    styl: 'stylus',
    coffee: 'coffee'
  };
  return typeMap[_.trimStart(ext, '.')];
}

function whicheverExists(...paths) {
  const result = _.find([...paths], pathName => pathExists.sync(pathName));
  return result;
}

function stripIgnoredBasePath(_path, basePaths) {
  // Remove dots and slashes to ensure we never write above root.
  const trimmedPath = _.trimStart(_path, './\\');

  const ignored = basePaths.find(base => _.startsWith(trimmedPath, _.trimEnd(base, './\\')));
  const ignoredLength = ignored ? (ignored + path.sep).length : 0;
  return  trimmedPath.substring(ignoredLength);
}

function changeExt(file, fromExt, toExt) {
  return path.join(path.dirname(file), path.basename(file, fromExt) + toExt);
}
