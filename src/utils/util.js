const _ = require('lodash');
const path = require('path');

module.exports = {
  getCompiledType,
  getType,
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

function stripIgnoredBasePath(_path, basePaths) {
  // Remove dots and slashes to ensure we never write above root.
  const trimmedPath = _.trimStart(_path, './\\');

  const ignored = basePaths.find(base => _.startsWith(trimmedPath, _.trimEnd(base, './\\')));
  const ignoredLength = ignored ? (ignored + path.sep).length : 0;
  return  trimmedPath.substring(ignoredLength);
}

function changeExt(file, toExt, fromExt) {
  const {dir, name} = path.parse(file);
  return path.join(dir, (fromExt ? path.basename(file, fromExt) : name) + toExt);
}
