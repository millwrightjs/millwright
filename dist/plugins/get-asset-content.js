'use strict';

var _ = require('lodash');
var cache = require('../utils/cache');

module.exports = getAssetContent;

function getAssetContent(dep) {
  var _cache$get = cache.get('files', dep.srcResolved),
      content = _cache$get.content,
      map = _cache$get.map,
      mapImports = _cache$get.mapImports;

  return _.assign({}, dep, { content: content, map: map, mapImports: mapImports });
}