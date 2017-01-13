'use strict';

var config = require('../config');
var util = require('../utils/util');
var path = require('path');
var _ = require('lodash');
var Concat = require('concat-with-sourcemaps');

module.exports = function concat(assets) {
  var webPaths = _(assets).map('webPath').uniq().value();

  return _.reduce(webPaths, function (acc, webPath) {
    var group = _.filter(assets, { webPath: webPath });
    return _.concat(acc, concatenate(group));
  }, []);

  function concatenate(group) {
    var result = _.pick(group[0], ['dirDest', 'filenameDest', 'groupKey', 'typeDest', 'filenameDest', 'dest', 'webPath', 'sourcemapPath']);

    var c = new Concat(true, result.dest, '\n');
    _.forEach(group, function (asset) {
      var mappedPath = util.stripIgnoredBasePath(asset.src, config.assetIgnoredBasePaths);
      c.add(mappedPath, asset.content, asset.map);
    });

    result.content = c.content.toString();
    result.map = c.sourceMap;

    return result;
  }
};