const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('../lib/lodash-extended');
const config = require('../config');
const util = require('../lib/util');

module.exports = function copySource(file) {
  const promises = [copyToSourcemaps(file.srcPath)];

  if (file.map) {
    const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
    _.forEach(parsedMap.sources, source => promises.push(copyToSourcemaps(source)));

    // Remap sources
    parsedMap.sources = _.map(parsedMap.sources, source => {
      return util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    });
    file.map = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  }

  return Promise.all(promises).then(() => file);

  function copyToSourcemaps(sourcePath) {
    const strippedSourcePath = util.stripIgnoredBasePath(sourcePath, config.templateIgnoredBasePaths);
    const sourcemapsPath = path.join(config.destBase, 'sourcemaps', strippedSourcePath);
    return _.attemptSilent(fs.copy, sourcePath, sourcemapsPath, {dereference: true});
  }

}
