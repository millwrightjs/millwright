'use strict';

var path = require('path');
var _ = require('lodash');
var config = require('../config');
var util = require('../utils/util');

module.exports = remapSources;

function remapSources(file) {
  var parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  parsedMap.sources = _.map(parsedMap.sources, function (source) {
    var strippedPath = util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    return path.join('/sourcemaps/', strippedPath);
  });
  var map = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  return _.assign(file, { map: map });
}