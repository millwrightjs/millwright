'use strict';

var path = require('path');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));
var _ = require('lodash');
var config = require('../config');
var util = require('../utils/util');

module.exports = function copySource(file) {
  var promises = [copyToSourcemaps(file.src)];

  if (file.map) {
    var parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
    _.forEach(parsedMap.sources, function (source) {
      return promises.push(copyToSourcemaps(source));
    });
  }

  return Promise.all(promises).then(function () {
    return file;
  });

  function copyToSourcemaps(sourcePath) {
    var strippedSourcePath = util.stripIgnoredBasePath(sourcePath, config.templateIgnoredBasePaths);
    var sourcemapsPath = path.join(config.destBase, 'sourcemaps', strippedSourcePath);
    return _.attemptSilent(fs.copy, sourcePath, sourcemapsPath, { dereference: true });
  }
};