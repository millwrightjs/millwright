'use strict';

var _ = require('lodash');
var path = require('path');

module.exports = {
  getCompiledType: getCompiledType,
  getType: getType,
  stripIgnoredBasePath: stripIgnoredBasePath,
  changeExt: changeExt
};

function getCompiledType(type) {
  // Accept an object with a 'type' property, or else assume a string
  type = _.get(type, 'type') || type;

  var typeMap = {
    css: ['sass', 'less', 'stylus'],
    js: ['coffee']
  };
  return _.findKey(typeMap, function (types) {
    return _.includes(types, type);
  });
}

function getType(ext) {
  var typeMap = {
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
  var trimmedPath = _.trimStart(_path, './\\');

  var ignored = basePaths.find(function (base) {
    return _.startsWith(trimmedPath, _.trimEnd(base, './\\'));
  });
  var ignoredLength = ignored ? (ignored + path.sep).length : 0;
  return trimmedPath.substring(ignoredLength);
}

function changeExt(file, toExt, fromExt) {
  var _path$parse = path.parse(file),
      dir = _path$parse.dir,
      name = _path$parse.name;

  return path.join(dir, (fromExt ? path.basename(file, fromExt) : name) + toExt);
}