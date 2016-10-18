const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('config');
const util = require('../util');

module.exports = function outputSourcemaps(file) {
  const mapsDir = path.join(config.destBase, 'sourcemaps');
  const sourcePath = path.join(mapsDir, file.srcPathStripped);
  const sourcePathObj = path.parse(sourcePath);
  const mapPath = path.join(sourcePathObj.dir, sourcePathObj.name + '.map' + sourcePathObj.ext);
  const sources = _.without(_.concat(file.srcPath, file.mapImports), undefined);

  const outputMap = fs.outputFile(mapPath, file.map);
  const outputSources = _.map(sources, source => {
    const strippedSource = util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    const mappedSource = path.join(mapsDir, strippedSource);
    return fs.copy(source, mappedSource, {dereference: true});
  });

  return Promise.all(_.concat(outputMap, outputSources)).then(() => file);
}
