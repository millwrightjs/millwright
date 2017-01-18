'use strict';

var path = require('path');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));
var _ = require('lodash');
var config = require('../config');

module.exports = function outputSourcemaps(file) {
  // Get paths
  var mapPath = path.join(config.destDir, 'sourcemaps', file.sourcemapPath);

  // Append sourceMappingURL to file
  var mapUrl = '/' + path.relative(file.dirDest, mapPath);
  var mapUrlStringBase = '# sourceMappingURL=' + mapUrl;
  var mapUrlString = file.typeDest === 'css' ? '/*' + mapUrlStringBase + ' */' : '//' + mapUrlStringBase;
  file.content += _.endsWith(file.content, '\n') ? mapUrlString : '\n' + mapUrlString;

  // Rebuild sourcemap for consistency, remap sources, then output
  var parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  var rebuiltMap = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  var outputMap = fs.outputFile(mapPath, rebuiltMap);

  return outputMap.then(function () {
    return file;
  });
};