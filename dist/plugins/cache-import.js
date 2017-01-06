'use strict';

var path = require('path');
var _ = require('lodash');
var pathExists = require('path-exists').sync;
var cache = require('../utils/cache');

module.exports = cacheImport;

function cacheImport(files) {
  _.forEach(files, function (file) {
    _.forEach(file.mapImports, function (source) {
      var resolved = path.resolve(source);
      if (pathExists(resolved)) {
        cache.push('deps', {
          src: source,
          srcResolved: resolved,
          consumer: file.srcResolved
        });
        var cached = cache.get('files', resolved);
        cached.role = cached.role || 'import';
      }
    });
  });
}