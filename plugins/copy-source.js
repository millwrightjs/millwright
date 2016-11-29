const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('../config');
const util = require('../utils/util');

module.exports = function copySource(file) {
  const promises = [copyToSourcemaps(file.srcPath)];

  if (file.map) {
    const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
    _.forEach(parsedMap.sources, source => promises.push(copyToSourcemaps(source)));
  }

  return Promise.all(promises).then(() => file);

  function copyToSourcemaps(sourcePath) {
    const strippedSourcePath = util.stripIgnoredBasePath(sourcePath, config.templateIgnoredBasePaths);
    const sourcemapsPath = path.join(config.destBase, 'sourcemaps', strippedSourcePath);
    return _.attemptSilent(fs.copy, sourcePath, sourcemapsPath, {dereference: true});
  }

}
