const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('../config');
const util = require('../lib/util');

module.exports = function copySource(file) {
  console.log(file.srcPath);
  // Get paths
  const mapsDir = path.join(config.destBase, 'sourcemaps');
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  parsedMap.sources = _.map(parsedMap.sources, source => path.relative(file.srcDir || '', source));

  // Copy source to sourcemaps directory
  const sources = _.without(_.concat(file.srcPath, parsedMap.sources), undefined);
  const outputSources = _.map(sources, source => {
    const strippedSource = util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    const mappedSource = path.join(mapsDir, strippedSource);
    return fs.copy(source, mappedSource, {dereference: true});
  });

  return Promise.all(outputSources).then(() => file);
}
