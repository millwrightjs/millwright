const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('../config');
const util = require('../lib/util');

module.exports = function outputSourcemaps(file) {
  // Get paths
  const mapsDir = path.join(config.destBase, 'sourcemaps');
  const mapPath = path.join(mapsDir, file.srcDirStripped, file.destFilename + '.map');

  // Append sourceMappingURL to file
  const mapUrl = path.relative(file.destDir, mapPath);
  const mapUrlStringBase = '# sourceMappingURL=' + mapUrl;
  const mapUrlString = file.type === 'css' ? `/*${mapUrlStringBase} */` : `//${mapUrlStringBase}`;
  file.content += _.endsWith(file.content, '\n') ? mapUrlString : '\n' + mapUrlString;

  // Copy source to sourcemaps directory
  const sources = _.without(_.concat(file.srcPath, file.mapImports), undefined);
  const outputSources = _.map(sources, source => {
    const strippedSource = util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    const mappedSource = path.join(mapsDir, strippedSource);
    return fs.copy(source, mappedSource, {dereference: true});
  });

  // Rebuild sourcemap for consistency, remap sources, then output
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  parsedMap.sources = _.map(parsedMap.sources, source => path.relative(file.srcDir, source));
  const rebuiltMap = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  const outputMap = fs.outputFile(mapPath, rebuiltMap);

  return Promise.all(_.concat(outputMap, outputSources)).then(() => file);
}
